import React, { useState, useRef } from 'react';
import { Save, Download, ArrowLeft, Type, Image, Square, Circle, Upload, Trash2, Copy, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface TemplateEditorProps {
  template?: any;
  onClose: () => void;
  onSave: (template: any) => void;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
    rotation?: number;
  };
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onClose,
  onSave
}) => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [zoom, setZoom] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTextElement = () => {
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Double click to edit',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      styles: {
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: 'transparent'
      }
    };
    setElements([...elements, newElement]);
  };

  const addShapeElement = (shapeType: 'rectangle' | 'circle') => {
    const newElement: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      content: shapeType,
      position: { x: 150, y: 150 },
      size: { width: 100, height: 100 },
      styles: {
        backgroundColor: '#3B82F6',
        borderRadius: shapeType === 'circle' ? 50 : 8,
        opacity: 1
      }
    };
    setElements([...elements, newElement]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newElement: CanvasElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        content: e.target?.result as string,
        position: { x: 200, y: 200 },
        size: { width: 200, height: 200 },
        styles: {
          borderRadius: 8,
          opacity: 1
        }
      };
      setElements([...elements, newElement]);
    };
    reader.readAsDataURL(file);
  };

  const updateElement = (elementId: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const duplicateElement = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const duplicated = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      position: { x: element.position.x + 20, y: element.position.y + 20 }
    };
    setElements([...elements, duplicated]);
  };

  const handleSave = () => {
    const templateData = {
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      backgroundColor,
      elements
    };
    onSave(templateData);
  };

  const handleDownload = () => {
    // In a real implementation, this would generate and download the template
    alert('Download functionality would be implemented here');
  };

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Template Editor</h1>
            <p className="text-sm text-gray-600">Design your social media template</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
          <button
            onClick={addTextElement}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Add Image"
          >
            <Image className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => addShapeElement('rectangle')}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Add Rectangle"
          >
            <Square className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => addShapeElement('circle')}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Add Circle"
          >
            <Circle className="w-5 h-5" />
          </button>
          
          <div className="border-t border-gray-700 w-8 my-2" />
          
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-200 overflow-auto relative">
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            Zoom: {Math.round(zoom * 100)}%
          </div>
          
          <div className="flex items-center justify-center min-h-full p-8">
            <div
              className="relative bg-white shadow-lg"
              style={{
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom,
                backgroundColor,
                transform: `scale(${zoom})`,
                transformOrigin: 'center'
              }}
            >
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move border-2 ${
                    selectedElement === element.id ? 'border-blue-500' : 'border-transparent'
                  } hover:border-blue-300 transition-colors`}
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                    transform: `rotate(${element.styles.rotation || 0}deg)`,
                    opacity: element.styles.opacity || 1
                  }}
                  onClick={() => setSelectedElement(element.id)}
                >
                  {element.type === 'text' && (
                    <div
                      className="w-full h-full flex items-center justify-center p-2"
                      style={{
                        fontSize: element.styles.fontSize,
                        fontFamily: element.styles.fontFamily,
                        fontWeight: element.styles.fontWeight,
                        color: element.styles.color,
                        backgroundColor: element.styles.backgroundColor,
                        borderRadius: element.styles.borderRadius
                      }}
                    >
                      {element.content}
                    </div>
                  )}
                  
                  {element.type === 'image' && (
                    <img
                      src={element.content}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{
                        borderRadius: element.styles.borderRadius
                      }}
                    />
                  )}
                  
                  {element.type === 'shape' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: element.styles.backgroundColor,
                        borderRadius: element.styles.borderRadius
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white border-l p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
          
          {selectedElementData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={selectedElementData.position.x}
                    onChange={(e) => updateElement(selectedElement!, {
                      position: { ...selectedElementData.position, x: parseInt(e.target.value) || 0 }
                    })}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={selectedElementData.position.y}
                    onChange={(e) => updateElement(selectedElement!, {
                      position: { ...selectedElementData.position, y: parseInt(e.target.value) || 0 }
                    })}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Y"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={selectedElementData.size.width}
                    onChange={(e) => updateElement(selectedElement!, {
                      size: { ...selectedElementData.size, width: parseInt(e.target.value) || 0 }
                    })}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    value={selectedElementData.size.height}
                    onChange={(e) => updateElement(selectedElement!, {
                      size: { ...selectedElementData.size, height: parseInt(e.target.value) || 0 }
                    })}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Height"
                  />
                </div>
              </div>
              
              {selectedElementData.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
                    <textarea
                      value={selectedElementData.content}
                      onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                    <input
                      type="number"
                      value={selectedElementData.styles.fontSize || 16}
                      onChange={(e) => updateElement(selectedElement!, {
                        styles: { ...selectedElementData.styles, fontSize: parseInt(e.target.value) || 16 }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <input
                      type="color"
                      value={selectedElementData.styles.color || '#000000'}
                      onChange={(e) => updateElement(selectedElement!, {
                        styles: { ...selectedElementData.styles, color: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2 h-10"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <input
                  type="color"
                  value={selectedElementData.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateElement(selectedElement!, {
                    styles: { ...selectedElementData.styles, backgroundColor: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                <input
                  type="number"
                  value={selectedElementData.styles.borderRadius || 0}
                  onChange={(e) => updateElement(selectedElement!, {
                    styles: { ...selectedElementData.styles, borderRadius: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => duplicateElement(selectedElement!)}
                  className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => deleteElement(selectedElement!)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Canvas Size</label>
                <select
                  value={`${canvasSize.width}x${canvasSize.height}`}
                  onChange={(e) => {
                    const [width, height] = e.target.value.split('x').map(Number);
                    setCanvasSize({ width, height });
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="1080x1080">Instagram Square (1080x1080)</option>
                  <option value="1080x1350">Instagram Portrait (1080x1350)</option>
                  <option value="1200x630">Facebook Post (1200x630)</option>
                  <option value="1920x1080">YouTube Thumbnail (1920x1080)</option>
                  <option value="1080x1920">Instagram Story (1080x1920)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-10"
                />
              </div>
              
              <div className="pt-4 text-center text-gray-500">
                <p className="text-sm">Select an element to edit its properties</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};