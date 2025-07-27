import React, { useState, useRef, useEffect } from 'react';
import { Save, ZoomIn, ZoomOut, Move, Type, Video, Image, Upload, Download, ArrowLeft, Trash2, Copy, RotateCcw, Play, Pause } from 'lucide-react';
import { moodboardAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface MoodboardCanvasProps {
  moodboard: any;
  onClose: () => void;
  onSave: (moodboard: any) => void;
}

interface CanvasItem {
  id: string;
  type: 'video' | 'image' | 'text';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: any;
  zIndex: number;
  metadata?: any;
}

export const MoodboardCanvas: React.FC<MoodboardCanvasProps> = ({
  moodboard,
  onClose,
  onSave
}) => {
  const { darkMode } = useTheme();
  const [items, setItems] = useState<CanvasItem[]>(moodboard.items || []);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [canvas, setCanvas] = useState(moodboard.canvas || {
    width: 1920,
    height: 1080,
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    zoom: 0.5,
    pan: { x: 0, y: 0 }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);


  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update canvas background when theme changes
  useEffect(() => {
    setCanvas(prev => ({
      ...prev,
      backgroundColor: darkMode ? '#263142ff' : '#ffffff'
    }));
  }, [darkMode]);


useEffect(() => {
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x);
      const dy = (e.clientY - dragStart.y);

      setCanvas(prev => ({
        ...prev,
        pan: {
          x: prev.pan.x + dx / prev.zoom,
          y: prev.pan.y + dy / prev.zoom,
        }
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (e.button === 1 && isDragging) {
      setIsDragging(false);
    }
  };

  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  return () => {
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDragging, dragStart]);



useEffect(() => {
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const { zoom, pan } = canvas;

            const adjustedX = (200 - pan.x) / zoom;
            const adjustedY = (200 - pan.y) / zoom;

            const newItem = {
              id: Date.now().toString(),
              type: 'image',
              content: imageData,
              position: { x: adjustedX, y: adjustedY },
              size: { width: img.width, height: img.height },
              styles: {},
              zIndex: items.length + 1,
            };
            setItems((prev) => [...prev, newItem]);
          };
          img.src = imageData;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  window.addEventListener('paste', handlePaste);
  return () => {
    window.removeEventListener('paste', handlePaste);
  };
}, [canvas]);



  // Add zoom with Ctrl + scroll

  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey) setIsCtrlPressed(true);
  };

  const handleKeyUp = () => {
    setIsCtrlPressed(false);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);

useEffect(() => {
  const down = (e: KeyboardEvent) => e.ctrlKey && setIsCtrlPressed(true);
  const up = () => setIsCtrlPressed(false);

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', up); // In case user switches window while holding Ctrl

  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', up);
  };
}, []);


useEffect(() => {
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      const isInsideCanvas = canvasRef.current?.contains(e.target as Node);

      if (isInsideCanvas) {
        e.preventDefault();

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, canvas.zoom * zoomFactor));

        setCanvas(prev => ({
          ...prev,
          zoom: newZoom
        }));
      }
    }
  };

  // 💥 Attach to the whole window to catch iframe scroll too
  window.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    window.removeEventListener('wheel', handleWheel);
  };
}, [canvas.zoom]);



  // Handle mouse events for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingItem && selectedItem) {
        const item = items.find(i => i.id === selectedItem);
        if (item) {
          const newX = (e.clientX - dragStart.x) / canvas.zoom;
          const newY = (e.clientY - dragStart.y) / canvas.zoom;
          handleItemUpdate(selectedItem, {
            position: { x: Math.max(0, newX), y: Math.max(0, newY) }
          });
        }
      } else if (isResizing && selectedItem && resizeHandle) {
        const item = items.find(i => i.id === selectedItem);
        if (item) {
          const deltaX = (e.clientX - dragStart.x) / canvas.zoom;
          const deltaY = (e.clientY - dragStart.y) / canvas.zoom;
          
          let newWidth = item.size.width;
          let newHeight = item.size.height;
          let newX = item.position.x;
          let newY = item.position.y;

          if (resizeHandle.includes('right')) newWidth = Math.max(50, item.size.width + deltaX);
          if (resizeHandle.includes('bottom')) newHeight = Math.max(50, item.size.height + deltaY);
          if (resizeHandle.includes('left')) {
            newWidth = Math.max(50, item.size.width - deltaX);
            newX = item.position.x + deltaX;
          }
          if (resizeHandle.includes('top')) {
            newHeight = Math.max(50, item.size.height - deltaY);
            newY = item.position.y + deltaY;
          }

          handleItemUpdate(selectedItem, {
            position: { x: Math.max(0, newX), y: Math.max(0, newY) },
            size: { width: newWidth, height: newHeight }
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingItem(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDraggingItem || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingItem, isResizing, selectedItem, dragStart, canvas.zoom, resizeHandle, items]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedMoodboard = {
        ...moodboard,
        items,
        canvas
      };
      
      const response = await moodboardAPI.update(moodboard.id, updatedMoodboard);
      onSave(response.data);
    } catch (error) {
      console.error('Error saving moodboard:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return;
    
    try {
      const response = await moodboardAPI.extractVideo({ url: videoUrl });
      const { embedUrl, platform, originalUrl } = response.data;
      
      const newItem: CanvasItem = {
        id: `video-${Date.now()}`,
        type: 'video',
        content: embedUrl,
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        styles: {
          borderRadius: 8,
          opacity: 1
        },
        zIndex: items.length + 1,
        metadata: {
          platform,
          originalUrl
        }
      };
      
      setItems([...items, newItem]);
      setVideoUrl('');
      setShowVideoModal(false);
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video. Please check the URL and try again.');
    }
  };

  const handleAddText = () => {
    if (!textContent.trim()) return;
    
    const newItem: CanvasItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: textContent,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      styles: {
        fontSize: 24,
        color: darkMode ? '#ffffff' : '#000000',
        fontFamily: 'Arial',
        fontWeight: 'normal',
        textAlign: 'left',
        backgroundColor: 'transparent'
      },
      zIndex: items.length + 1
    };
    
    setItems([...items, newItem]);
    setTextContent('');
    setShowTextModal(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await moodboardAPI.uploadImage(moodboard.id, formData);
      const { s3Url, originalName, size, mimeType, s3Key } = response.data;

      const newItem: CanvasItem = {
        id: `image-${Date.now()}`,
        type: 'image',
        content: s3Url,
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 },
        styles: {
          borderRadius: 8,
          opacity: 1
        },
        zIndex: items.length + 1,
        metadata: {
          originalName,
          fileSize: size,
          mimeType,
          s3Key
        }
      };

      setItems([...items, newItem]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleItemUpdate = (itemId: string, updates: Partial<CanvasItem>) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    setSelectedItem(null);
  };

  const handleDuplicateItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const duplicatedItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      position: { x: item.position.x + 20, y: item.position.y + 20 },
      zIndex: items.length + 1
    };

    setItems([...items, duplicatedItem]);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const zoomFactor = direction === 'in' ? 1.2 : 0.8;
    const newZoom = Math.max(0.1, Math.min(3, canvas.zoom * zoomFactor));
    setCanvas({ ...canvas, zoom: newZoom });
  };

  const handleResetView = () => {
    setCanvas({
      ...canvas,
      zoom: 0.5,
      pan: { x: 0, y: 0 }
    });
  };

  const handleItemMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setSelectedItem(itemId);
    setIsDraggingItem(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const renderResizeHandles = (item: CanvasItem) => {
    if (selectedItem !== item.id) return null;

    const handles = [
      { position: 'top-left', cursor: 'nw-resize', style: { top: -4, left: -4 } },
      { position: 'top-right', cursor: 'ne-resize', style: { top: -4, right: -4 } },
      { position: 'bottom-left', cursor: 'sw-resize', style: { bottom: -4, left: -4 } },
      { position: 'bottom-right', cursor: 'se-resize', style: { bottom: -4, right: -4 } },
      { position: 'top', cursor: 'n-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
      { position: 'bottom', cursor: 's-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
      { position: 'left', cursor: 'w-resize', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
      { position: 'right', cursor: 'e-resize', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } }
    ];

    return (
      <>
        {handles.map((handle) => (
          <div
            key={handle.position}
            className="absolute w-2 h-2 bg-blue-500 border border-white rounded-sm"
            style={{ ...handle.style, cursor: handle.cursor }}
            onMouseDown={(e) => handleResizeMouseDown(e, handle.position)}
          />
        ))}
      </>
    );
  };

  const selectedItemData = selectedItem ? items.find(i => i.id === selectedItem) : null;

  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} z-50 flex flex-col`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{moodboard.title}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Moodboard Canvas</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
          <button
            onClick={() => setShowVideoModal(true)}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Add Video"
          >
            <Video className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Upload Image"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent" />
            ) : (
              <Image className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={() => setShowTextModal(true)}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          
          <div className="border-t border-gray-700 w-8 my-2" />
          
          <button
            onClick={() => handleZoom('in')}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleZoom('out')}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleResetView}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} overflow-clip relative`}>
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            Zoom: {Math.round(canvas.zoom * 100)}% | Ctrl + Scroll to zoom
          </div>
          <div
  ref={canvasRef}
  tabIndex={0} 
  className="absolute inset-0"
  style={{
    transform: `scale(${canvas.zoom}) translate(${canvas.pan.x}px, ${canvas.pan.y}px)`,
    transformOrigin: '0 0',
    willChange: 'transform'
  }}
>
            <div
  className="relative"
  onClick={() => setSelectedItem(null)}
  style={{
    minWidth: 20000,
    minHeight: 10000,
    backgroundColor: canvas.backgroundColor
  }}
>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`absolute cursor-move border-2 ${
                    selectedItem === item.id ? 'border-purple-500' : 'border-transparent'
                  } hover:border-purple-300 transition-colors`}
                  style={{
                    left: item.position.x,
                    top: item.position.y,
                    width: item.size.width,
                    height: item.size.height,
                    zIndex: item.zIndex,
                    opacity: item.styles.opacity || 1
                  }}
                  onClick={() => setSelectedItem(item.id)}
                  onMouseDown={(e) => handleItemMouseDown(e, item.id)}
                >
{item.type === 'video' && (
  <div className="relative w-full h-full">
    {isCtrlPressed && (
      <div className="absolute inset-0 z-50 bg-transparent cursor-not-allowed" />
    )}
    <iframe
      src={item.content}
      className="w-full h-full rounded"
      style={{ borderRadius: item.styles.borderRadius || 0 }}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
)}
                  
                  {item.type === 'image' && (
                    <img
  src={item.content || item.metadata?.s3Url}
  style={{
    position: 'absolute',
    left: item.position.x,
    top: item.position.y,
    width: item.size.width,
    height: item.size.height,
    zIndex: item.zIndex,
    ...item.styles
  }}
  alt=""
/>
                  )}
                  
                  {item.type === 'text' && (
                    <div
                      className="w-full h-full flex items-center justify-center p-2"
                      style={{
                        fontSize: item.styles.fontSize || 16,
                        color: item.styles.color || '#000000',
                        fontFamily: item.styles.fontFamily || 'Arial',
                        fontWeight: item.styles.fontWeight || 'normal',
                        textAlign: item.styles.textAlign || 'left',
                        backgroundColor: item.styles.backgroundColor || 'transparent',
                        borderRadius: item.styles.borderRadius || 0
                      }}
                    >
                      {item.content}
                    </div>
                  )}
                  
                  {/* Resize Handles */}
                  {renderResizeHandles(item)}
                  
                  {selectedItem === item.id && (
                    <div className={`absolute -top-8 left-0 flex items-center space-x-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded shadow-lg px-2 py-1`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateItem(item.id);
                        }}
                        className={`p-1 ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className={`p-1 ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'} transition-colors`}
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedItemData && (
          <div className={`w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-6 overflow-y-auto`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Properties</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={selectedItemData.position.x}
                    onChange={(e) => handleItemUpdate(selectedItem!, {
                      position: { ...selectedItemData.position, x: parseInt(e.target.value) || 0 }
                    })}
                    className={`border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={selectedItemData.position.y}
                    onChange={(e) => handleItemUpdate(selectedItem!, {
                      position: { ...selectedItemData.position, y: parseInt(e.target.value) || 0 }
                    })}
                    className={`border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                    placeholder="Y"
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={selectedItemData.size.width}
                    onChange={(e) => handleItemUpdate(selectedItem!, {
                      size: { ...selectedItemData.size, width: parseInt(e.target.value) || 0 }
                    })}
                    className={`border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    value={selectedItemData.size.height}
                    onChange={(e) => handleItemUpdate(selectedItem!, {
                      size: { ...selectedItemData.size, height: parseInt(e.target.value) || 0 }
                    })}
                    className={`border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                    placeholder="Height"
                  />
                </div>
              </div>
              
              {selectedItemData.type === 'text' && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Content</label>
                    <textarea
                      value={selectedItemData.content}
                      onChange={(e) => handleItemUpdate(selectedItem!, { content: e.target.value })}
                      className={`w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Font Size</label>
                    <input
                      type="number"
                      value={selectedItemData.styles.fontSize || 16}
                      onChange={(e) => handleItemUpdate(selectedItem!, {
                        styles: { ...selectedItemData.styles, fontSize: parseInt(e.target.value) || 16 }
                      })}
                      className={`w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Color</label>
                    <input
                      type="color"
                      value={selectedItemData.styles.color || '#000000'}
                      onChange={(e) => handleItemUpdate(selectedItem!, {
                        styles: { ...selectedItemData.styles, color: e.target.value }
                      })}
                      className={`w-full border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} rounded px-3 py-2 h-10`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Font Family</label>
                    <select
                      value={selectedItemData.styles.fontFamily || 'Arial'}
                      onChange={(e) => handleItemUpdate(selectedItem!, {
                        styles: { ...selectedItemData.styles, fontFamily: e.target.value }
                      })}
                      className={`w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Border Radius</label>
                <input
                  type="number"
                  value={selectedItemData.styles.borderRadius || 0}
                  onChange={(e) => handleItemUpdate(selectedItem!, {
                    styles: { ...selectedItemData.styles, borderRadius: parseInt(e.target.value) || 0 }
                  })}
                  className={`w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded px-3 py-2 text-sm`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedItemData.styles.opacity || 1}
                  onChange={(e) => handleItemUpdate(selectedItem!, {
                    styles: { ...selectedItemData.styles, opacity: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Add Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Add Video</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Video URL</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className={`w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="Paste YouTube, Instagram, TikTok, or Twitter URL..."
                />
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Supported platforms: YouTube, Instagram, TikTok, Twitter
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowVideoModal(false)}
                className={`flex-1 px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={!videoUrl.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Add Text</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Text Content</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className={`w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="Enter your text..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTextModal(false)}
                className={`flex-1 px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddText}
                disabled={!textContent.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};