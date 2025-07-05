import { Goal, Task, Note, GoogleAlert, Article, YouTubeScript, Email, EmailCampaign, AudienceList, Contact } from '../types';

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Launch Ooopzzz YouTube Channel',
    description: 'Build and grow my YouTube channel focused on AI tools and productivity',
    category: 'Business',
    priority: 'high',
    status: 'active',
    progress: 65,
    dueDate: new Date('2025-03-31'),
    createdAt: new Date('2025-01-01'),
    tasks: [],
    notes: []
  },
  {
    id: '2',
    title: 'Master AI Content Creation',
    description: 'Learn advanced techniques for AI-powered content creation',
    category: 'Learning',
    priority: 'medium',
    status: 'active',
    progress: 40,
    dueDate: new Date('2025-04-15'),
    createdAt: new Date('2025-01-05'),
    tasks: [],
    notes: []
  },
  {
    id: '3',
    title: 'Build Personal Brand',
    description: 'Establish strong personal brand across social media platforms',
    category: 'Marketing',
    priority: 'medium',
    status: 'active',
    progress: 25,
    dueDate: new Date('2025-06-30'),
    createdAt: new Date('2025-01-10'),
    tasks: [],
    notes: []
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    goalId: '1',
    title: 'Create channel branding',
    description: 'Design logo, banner, and channel art for YouTube channel',
    priority: 'high',
    status: 'completed',
    dueDate: new Date('2025-01-15'),
    createdAt: new Date('2025-01-01'),
    attachments: [
      { id: '1', name: 'logo-design.png', type: 'file', url: '/files/logo-design.png', size: 245000 }
    ]
  },
  {
    id: '2',
    goalId: '1',
    title: 'Write first 10 video scripts',
    description: 'Create engaging scripts about AI tools for initial video content',
    priority: 'high',
    status: 'in-progress',
    dueDate: new Date('2025-01-30'),
    createdAt: new Date('2025-01-05'),
    attachments: []
  },
  {
    id: '3',
    goalId: '1',
    title: 'Set up recording equipment',
    description: 'Purchase and configure camera, microphone, and lighting setup',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date('2025-02-01'),
    createdAt: new Date('2025-01-08'),
    attachments: []
  },
  {
    id: '4',
    goalId: '2',
    title: 'Complete AI course on Coursera',
    description: 'Finish the Machine Learning Specialization course',
    priority: 'medium',
    status: 'in-progress',
    dueDate: new Date('2025-02-15'),
    createdAt: new Date('2025-01-05'),
    attachments: []
  },
  {
    id: '5',
    goalId: '2',
    title: 'Practice with ChatGPT API',
    description: 'Build sample applications using OpenAI API',
    priority: 'high',
    status: 'pending',
    dueDate: new Date('2025-01-25'),
    createdAt: new Date('2025-01-10'),
    attachments: []
  },
  {
    id: '6',
    goalId: '3',
    title: 'Create LinkedIn content strategy',
    description: 'Develop content calendar and posting schedule for LinkedIn',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date('2025-01-28'),
    createdAt: new Date('2025-01-12'),
    attachments: []
  },
  {
    id: '7',
    goalId: '1',
    title: 'Research trending AI topics',
    description: 'Analyze current trends in AI tools and productivity software',
    priority: 'low',
    status: 'completed',
    dueDate: new Date('2025-01-10'),
    createdAt: new Date('2025-01-01'),
    attachments: []
  },
  {
    id: '8',
    goalId: '3',
    title: 'Design personal website',
    description: 'Create portfolio website showcasing projects and expertise',
    priority: 'high',
    status: 'pending',
    dueDate: new Date('2025-02-28'),
    createdAt: new Date('2025-01-15'),
    attachments: []
  },
  {
    id: '9',
    goalId: '2',
    title: 'Experiment with Midjourney',
    description: 'Learn advanced prompt engineering for AI image generation',
    priority: 'low',
    status: 'in-progress',
    dueDate: new Date('2025-01-20'),
    createdAt: new Date('2025-01-08'),
    attachments: []
  },
  {
    id: '10',
    goalId: '1',
    title: 'Plan first month content',
    description: 'Create detailed content calendar for first 30 days of channel',
    priority: 'high',
    status: 'pending',
    dueDate: new Date('2025-01-18'),
    createdAt: new Date('2025-01-12'),
    attachments: []
  }
];

export const mockNotes: Note[] = [
  {
    id: '1',
    goalId: '1',
    title: 'YouTube Video Ideas',
    content: `# Video Ideas for Ooopzzz Channel

## AI Tools Series
- Top 10 AI Tools for Content Creators
- ChatGPT vs Claude: Which is Better?
- AI Image Generation Tutorial with Midjourney
- Building a Chatbot with OpenAI API

## Productivity Content
- My Daily Productivity Routine
- How I Use AI to Save 10 Hours Per Week
- The Ultimate AI-Powered Workspace Setup

## Tutorial Ideas
- Creating YouTube Thumbnails with AI
- Writing Scripts with AI Assistance
- Automating Social Media with AI Tools

## Collaboration Ideas
- Interview with AI Tool Creators
- Reaction to Latest AI Announcements
- AI Tool Reviews and Comparisons`,
    tags: ['youtube', 'content', 'ai-tools', 'ideas'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
    attachments: []
  },
  {
    id: '2',
    goalId: '2',
    title: 'AI Learning Resources',
    content: `# AI Learning Path

## Courses Completed
- [x] Introduction to Machine Learning (Coursera)
- [x] Deep Learning Basics (edX)
- [ ] Advanced NLP Techniques
- [ ] Computer Vision Fundamentals

## Books to Read
- "Hands-On Machine Learning" by Aurélien Géron
- "The Hundred-Page Machine Learning Book" by Andriy Burkov
- "AI for People in a Hurry" by Neil Reddy

## Practical Projects
1. Build a sentiment analysis tool
2. Create an image classifier
3. Develop a recommendation system
4. Build a chatbot from scratch

## Key Concepts to Master
- Neural Networks
- Natural Language Processing
- Computer Vision
- Reinforcement Learning`,
    tags: ['learning', 'ai', 'courses', 'books'],
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-12'),
    attachments: []
  },
  {
    id: '3',
    goalId: '3',
    title: 'Personal Brand Strategy',
    content: `# Personal Brand Development

## Brand Identity
**Mission**: Democratize AI knowledge for content creators
**Vision**: Become the go-to resource for AI-powered productivity
**Values**: Innovation, Education, Accessibility

## Content Pillars
1. **AI Tool Reviews** (40%)
2. **Productivity Tips** (30%)
3. **Behind-the-Scenes** (20%)
4. **Industry News** (10%)

## Platform Strategy
- **YouTube**: Long-form tutorials and reviews
- **LinkedIn**: Professional insights and articles
- **Twitter**: Quick tips and industry commentary
- **Instagram**: Visual content and stories

## Content Calendar
- Monday: AI Tool Spotlight
- Wednesday: Productivity Wednesday
- Friday: Week in AI Review
- Sunday: Behind-the-scenes content`,
    tags: ['branding', 'strategy', 'content', 'social-media'],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-14'),
    attachments: []
  },
  {
    id: '4',
    title: 'Meeting Notes - AI Conference 2025',
    content: `# AI Conference 2025 - Key Takeaways

## Keynote Highlights
- GPT-5 announcement with multimodal capabilities
- New breakthrough in computer vision accuracy
- Ethical AI guidelines becoming industry standard

## Networking Contacts
- Sarah Chen (OpenAI) - sarah@openai.com
- Mike Rodriguez (Anthropic) - mike@anthropic.com
- Dr. Lisa Wang (Stanford AI Lab) - lwang@stanford.edu

## Action Items
- [ ] Follow up with Sarah about collaboration
- [ ] Research new vision models mentioned
- [ ] Write blog post about conference insights
- [ ] Update AI tools comparison spreadsheet

## Interesting Quotes
> "The future of AI is not about replacing humans, but augmenting human creativity" - Dr. Lisa Wang

## Tools Discovered
- **Runway Gen-3**: Next-gen video generation
- **Claude 3.5**: Enhanced reasoning capabilities
- **Midjourney V7**: Photorealistic image generation`,
    tags: ['conference', 'networking', 'ai-trends', 'notes'],
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-08'),
    attachments: []
  },
  {
    id: '5',
    goalId: '1',
    title: 'Channel Analytics & Growth Strategy',
    content: `# YouTube Channel Growth Analysis

## Current Metrics (Month 1)
- Subscribers: 1,247
- Total Views: 15,632
- Average View Duration: 3:42
- Click-through Rate: 8.2%

## Top Performing Videos
1. "5 AI Tools That Changed My Life" - 2,341 views
2. "ChatGPT vs Claude Comparison" - 1,876 views
3. "Building My AI Workspace" - 1,523 views

## Growth Strategies
### Content Optimization
- Focus on trending AI topics
- Improve thumbnail design
- Add chapters to longer videos
- Create compelling hooks in first 15 seconds

### SEO Improvements
- Research high-volume keywords
- Optimize video descriptions
- Use relevant tags consistently
- Create custom thumbnails for all videos

### Community Building
- Respond to all comments within 24 hours
- Create community posts weekly
- Host live Q&A sessions monthly
- Collaborate with other AI creators

## Goals for Next Month
- Reach 2,000 subscribers
- Achieve 25,000 total views
- Improve average view duration to 4+ minutes
- Launch first live stream`,
    tags: ['youtube', 'analytics', 'growth', 'strategy'],
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-16'),
    attachments: []
  }
];

export const mockGoogleAlerts: GoogleAlert[] = [
  {
    id: '1',
    keyword: 'AI tools',
    rssUrl: 'https://www.google.com/alerts/feeds/12345/ai-tools',
    isActive: true,
    category: 'Technology',
    createdAt: new Date('2025-01-01'),
    lastFetch: new Date('2025-01-15'),
    articles: []
  },
  {
    id: '2',
    keyword: 'YouTube growth',
    rssUrl: 'https://www.google.com/alerts/feeds/12346/youtube-growth',
    isActive: true,
    category: 'Marketing',
    createdAt: new Date('2025-01-01'),
    lastFetch: new Date('2025-01-15'),
    articles: []
  },
  {
    id: '3',
    keyword: 'ChatGPT updates',
    rssUrl: 'https://www.google.com/alerts/feeds/12347/chatgpt-updates',
    isActive: true,
    category: 'Technology',
    createdAt: new Date('2025-01-02'),
    lastFetch: new Date('2025-01-15'),
    articles: []
  },
  {
    id: '4',
    keyword: 'Content creation AI',
    rssUrl: 'https://www.google.com/alerts/feeds/12348/content-creation-ai',
    isActive: false,
    category: 'Technology',
    createdAt: new Date('2025-01-03'),
    lastFetch: new Date('2025-01-10'),
    articles: []
  }
];

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Top 5 AI Tools That Will Change Content Creation in 2025',
    description: 'Discover the revolutionary AI tools that are transforming how creators work, from script writing to video editing and everything in between.',
    url: 'https://techcrunch.com/ai-tools-2025',
    publishedAt: new Date('2025-01-14'),
    source: 'TechCrunch',
    keyword: 'AI tools'
  },
  {
    id: '2',
    title: 'How AI is Revolutionizing Video Production',
    description: 'From script writing to video editing, AI is changing everything about how we create video content. Here\'s what you need to know.',
    url: 'https://theverge.com/ai-video-production',
    publishedAt: new Date('2025-01-13'),
    source: 'The Verge',
    keyword: 'AI tools'
  },
  {
    id: '3',
    title: 'YouTube Algorithm Changes: What Creators Need to Know',
    description: 'YouTube has announced significant changes to its recommendation algorithm. Here\'s how it affects content creators and growth strategies.',
    url: 'https://socialmediatoday.com/youtube-algorithm-2025',
    publishedAt: new Date('2025-01-12'),
    source: 'Social Media Today',
    keyword: 'YouTube growth'
  },
  {
    id: '4',
    title: 'ChatGPT-5 Release Date and New Features Revealed',
    description: 'OpenAI has finally revealed details about ChatGPT-5, including its release timeline and groundbreaking new capabilities.',
    url: 'https://openai.com/blog/chatgpt-5-announcement',
    publishedAt: new Date('2025-01-11'),
    source: 'OpenAI Blog',
    keyword: 'ChatGPT updates'
  },
  {
    id: '5',
    title: 'The Ultimate Guide to Growing Your YouTube Channel in 2025',
    description: 'Expert strategies and proven tactics for growing your YouTube channel, including algorithm optimization and audience engagement.',
    url: 'https://creatoreconomy.com/youtube-growth-guide-2025',
    publishedAt: new Date('2025-01-10'),
    source: 'Creator Economy',
    keyword: 'YouTube growth'
  },
  {
    id: '6',
    title: 'AI-Powered Content Creation: Tools Every Creator Should Know',
    description: 'A comprehensive review of the best AI tools for content creators, including pricing, features, and real-world use cases.',
    url: 'https://contentcreator.com/ai-tools-review',
    publishedAt: new Date('2025-01-09'),
    source: 'Content Creator Magazine',
    keyword: 'Content creation AI'
  }
];

export const mockScripts: YouTubeScript[] = [
  {
    id: '1',
    title: 'AI Tools Revolution - 60 Second Script',
    content: `🚀 **Hook**: "What if I told you that 5 AI tools could replace your entire content team?"

**Value**: 
- Tool 1: ChatGPT for script writing - saves 3 hours per video
- Tool 2: Midjourney for thumbnails - professional designs in minutes
- Tool 3: ElevenLabs for voiceovers - human-like AI voices
- Tool 4: Runway for video editing - AI-powered editing magic
- Tool 5: Buffer for scheduling - automate your entire posting schedule

**CTA**: "Which tool shocked you the most? Drop a comment and don't forget to subscribe for more AI secrets that will transform your content game!"

---
*Generated with AI • Witty tone • ${new Date().toLocaleDateString()}*`,
    tone: 'witty',
    source: 'Google Alerts: AI tools',
    createdAt: new Date('2025-01-15'),
    keywords: ['AI tools', 'content creation', 'productivity']
  },
  {
    id: '2',
    title: 'YouTube Growth Secrets - Emotional Hook',
    content: `💫 **Hook**: "I was stuck at 100 subscribers for 6 months... then I discovered this YouTube growth secret that changed everything."

**Value**: 
- The psychology behind viral content
- How to create emotional connections with your audience
- The 3-second rule that determines if viewers stay or leave
- Why authenticity beats perfection every single time
- The one mistake 99% of creators make with thumbnails

**CTA**: "If this helped you see YouTube differently, you're going to love what I share next week. Hit that subscribe button and let me know in the comments - what's your biggest YouTube struggle right now?"

---
*Generated with AI • Emotional tone • ${new Date().toLocaleDateString()}*`,
    tone: 'emotional',
    source: 'Google Alerts: YouTube growth',
    createdAt: new Date('2025-01-14'),
    keywords: ['YouTube growth', 'content strategy', 'audience engagement']
  },
  {
    id: '3',
    title: 'ChatGPT Update Breakdown - Informative',
    content: `📚 **Hook**: "ChatGPT just got a massive update, and here's everything you need to know in 60 seconds."

**Value**: 
- New multimodal capabilities - now processes images, audio, and text
- 40% faster response times compared to previous version
- Enhanced reasoning abilities for complex problem-solving
- New plugin ecosystem for specialized tasks
- Improved safety features and content filtering

**Key Takeaway**: This update makes ChatGPT more versatile than ever for content creators, developers, and business professionals.

**CTA**: "Want to stay updated on the latest AI developments? Subscribe and ring that notification bell so you never miss a breakthrough!"

---
*Generated with AI • Informative tone • ${new Date().toLocaleDateString()}*`,
    tone: 'informative',
    source: 'Google Alerts: ChatGPT updates',
    createdAt: new Date('2025-01-13'),
    keywords: ['ChatGPT', 'AI updates', 'technology news']
  },
  {
    id: '4',
    title: 'Content Creation AI Tools - Casual Review',
    content: `👋 **Hook**: "Hey everyone! So I've been testing these AI content creation tools for the past month, and honestly... some of them blew my mind."

**Value**: 
- Jasper AI: Great for blog posts, but pricey at $49/month
- Copy.ai: Perfect for social media captions and ads
- Writesonic: Best bang for your buck at $19/month
- Grammarly: Not just grammar - now has AI writing assistance
- Notion AI: If you're already using Notion, this is a no-brainer

**Personal Take**: I'm actually using 3 of these daily now. The time savings are insane.

**CTA**: "Which one are you most excited to try? Let me know below, and if you want more honest AI tool reviews like this, definitely subscribe!"

---
*Generated with AI • Casual tone • ${new Date().toLocaleDateString()}*`,
    tone: 'casual',
    source: 'Google Alerts: Content creation AI',
    createdAt: new Date('2025-01-12'),
    keywords: ['content creation', 'AI tools', 'tool reviews']
  }
];

export const mockEmails: Email[] = [
  {
    id: '1',
    from: 'john.creator@example.com',
    to: ['you@ooopzzz.com'],
    subject: 'Collaboration Opportunity - AI Tools Video',
    content: `Hi there!

I've been following your Ooopzzz channel and I'm really impressed with your AI tools content. I run a similar channel focused on productivity tools and I think our audiences would love a collaboration.

I was thinking we could do a joint video comparing our favorite AI tools for content creation. What do you think?

Looking forward to hearing from you!

Best,
John`,
    isRead: false,
    isStarred: true,
    labels: ['collaboration', 'important'],
    receivedAt: new Date('2025-01-15'),
    attachments: []
  },
  {
    id: '2',
    from: 'youtube-noreply@youtube.com',
    to: ['you@ooopzzz.com'],
    subject: 'Your channel analytics for last week',
    content: `Your channel gained 150 new subscribers this week! 

Here's your weekly summary:
- 150 new subscribers (+12% from last week)
- 5,234 views (+8% from last week)
- 342 hours of watch time (+15% from last week)

Your top performing video: "5 AI Tools That Changed My Life"

Keep up the great work!`,
    isRead: true,
    isStarred: false,
    labels: ['youtube', 'analytics'],
    receivedAt: new Date('2025-01-14'),
    attachments: []
  },
  {
    id: '3',
    from: 'sarah@openai.com',
    to: ['you@ooopzzz.com'],
    subject: 'Re: Interview Request for ChatGPT-5 Launch',
    content: `Hi!

Thanks for reaching out about the ChatGPT-5 launch. We'd love to have you as part of our creator program for the announcement.

Would you be available for a brief interview next Tuesday at 2 PM PST? We can discuss the new features and how they might benefit content creators.

Let me know if this works for you!

Best regards,
Sarah Chen
OpenAI Creator Relations`,
    isRead: false,
    isStarred: true,
    labels: ['interview', 'openai', 'important'],
    receivedAt: new Date('2025-01-13'),
    attachments: []
  },
  {
    id: '4',
    from: 'support@midjourney.com',
    to: ['you@ooopzzz.com'],
    subject: 'Your Midjourney subscription renewal',
    content: `Your Midjourney Pro subscription will renew in 3 days.

Subscription Details:
- Plan: Pro ($30/month)
- Renewal Date: January 18, 2025
- Features: Unlimited generations, commercial usage rights

If you need to make any changes to your subscription, please visit your account settings.

Thank you for being a valued member!`,
    isRead: true,
    isStarred: false,
    labels: ['billing', 'midjourney'],
    receivedAt: new Date('2025-01-12'),
    attachments: []
  },
  {
    id: '5',
    from: 'newsletter@techcrunch.com',
    to: ['you@ooopzzz.com'],
    subject: 'AI Weekly: Major breakthroughs in 2025',
    content: `This week in AI:

🚀 OpenAI announces ChatGPT-5 with multimodal capabilities
🎨 Adobe integrates AI into entire Creative Suite
🤖 Google's Gemini gets major reasoning upgrade
📱 Apple reveals AI features coming to iOS 18
🎬 Hollywood embraces AI for film production

Read the full newsletter at techcrunch.com/ai-weekly

Stay ahead of the curve!`,
    isRead: true,
    isStarred: false,
    labels: ['newsletter', 'ai-news'],
    receivedAt: new Date('2025-01-11'),
    attachments: []
  }
];

export const mockCampaigns: EmailCampaign[] = [
  {
    id: '1',
    name: 'Weekly AI Newsletter',
    subject: '🤖 This Week in AI: Game-Changing Tools You Need to Know',
    content: `Hello AI enthusiasts!

Welcome to this week's AI newsletter. Here are the most exciting developments:

🔥 TOP PICKS THIS WEEK:
1. ChatGPT-5 announcement with multimodal capabilities
2. New AI video generation tool from Runway
3. Adobe's AI integration across Creative Suite
4. Google's Gemini reasoning breakthrough

💡 TOOL SPOTLIGHT: Runway Gen-3
This week I'm highlighting Runway's new video generation model. The quality is absolutely mind-blowing - check out my full review on YouTube.

📺 LATEST VIDEOS:
- "5 AI Tools That Will Replace Your Design Team"
- "ChatGPT vs Claude: The Ultimate Comparison"
- "Building an AI-Powered Workflow"

🎯 QUICK TIP:
Use AI tools in combination for maximum impact. I'm now using ChatGPT for ideation, Midjourney for visuals, and ElevenLabs for voiceovers - it's a game-changer!

Keep innovating!
[Your Name]

P.S. Reply and let me know which AI tool you're most excited about!`,
    audienceList: 'ai-enthusiasts',
    status: 'sent',
    sentAt: new Date('2025-01-14'),
    stats: {
      sent: 1250,
      opened: 875,
      clicked: 234
    }
  },
  {
    id: '2',
    name: 'New Video Alert',
    subject: '🎬 New Video: 5 AI Tools That Will Blow Your Mind',
    content: `Hey there!

I just uploaded a new video that I'm really excited about. In this one, I dive deep into 5 AI tools that are absolutely revolutionary for content creators.

🎥 WATCH NOW: [Video Link]

What you'll learn:
✅ How to generate professional thumbnails in seconds
✅ The AI tool that writes better scripts than humans
✅ Voice cloning technology that sounds 100% real
✅ Video editing AI that saves hours of work
✅ The automation tool that runs your entire social media

This video took me weeks to research and test these tools. I think you're going to love it!

Watch it here: [Link]

Let me know in the comments which tool surprised you the most!

Talk soon,
[Your Name]`,
    audienceList: 'subscribers',
    status: 'draft',
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0
    }
  },
  {
    id: '3',
    name: 'Exclusive AI Tools Discount',
    subject: '🎁 Exclusive: 50% Off Premium AI Tools (24 Hours Only)',
    content: `Special offer for my subscribers!

I've partnered with some of the best AI tool companies to bring you exclusive discounts:

🔥 LIMITED TIME OFFERS:
• Jasper AI: 50% off first 3 months (Code: OOOPZZZ50)
• Midjourney: 1 month free with annual plan
• ElevenLabs: 40% off Pro plan (Code: VOICE40)
• Runway: Free trial extended to 30 days
• Copy.ai: 60% off lifetime deal

⏰ These deals expire in 24 hours!

Why I recommend these tools:
- I use them daily in my content creation
- They've saved me 20+ hours per week
- The ROI is incredible for creators
- Perfect for beginners and pros alike

Get your discounts here: [Link]

Questions? Just reply to this email!

Happy creating!
[Your Name]`,
    audienceList: 'ai-enthusiasts',
    status: 'scheduled',
    scheduledAt: new Date('2025-01-16'),
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0
    }
  }
];

export const mockAudienceLists: AudienceList[] = [
  {
    id: 'ai-enthusiasts',
    name: 'AI Enthusiasts',
    description: 'People interested in AI tools and automation for content creation',
    contacts: [],
    createdAt: new Date('2025-01-01')
  },
  {
    id: 'subscribers',
    name: 'YouTube Subscribers',
    description: 'Email subscribers from YouTube channel and website',
    contacts: [],
    createdAt: new Date('2025-01-01')
  },
  {
    id: 'course-students',
    name: 'Course Students',
    description: 'People who have purchased AI courses or workshops',
    contacts: [],
    createdAt: new Date('2025-01-05')
  },
  {
    id: 'collaborators',
    name: 'Collaborators & Partners',
    description: 'Other creators and business partners for networking',
    contacts: [],
    createdAt: new Date('2025-01-03')
  }
];

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    tags: ['ai-enthusiast', 'early-adopter', 'youtube-subscriber'],
    subscribed: true,
    addedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@creativestudio.com',
    tags: ['content-creator', 'collaborator', 'youtube-subscriber'],
    subscribed: true,
    addedAt: new Date('2025-01-02')
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@techstartup.io',
    tags: ['developer', 'ai-enthusiast', 'course-student'],
    subscribed: true,
    addedAt: new Date('2025-01-03')
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    email: 'emily.r@marketingagency.com',
    tags: ['marketer', 'ai-tools', 'newsletter-subscriber'],
    subscribed: true,
    addedAt: new Date('2025-01-04')
  },
  {
    id: '5',
    name: 'David Kim',
    email: 'david@designstudio.com',
    tags: ['designer', 'midjourney-user', 'youtube-subscriber'],
    subscribed: false,
    addedAt: new Date('2025-01-05')
  },
  {
    id: '6',
    name: 'Lisa Wang',
    email: 'lisa.wang@university.edu',
    tags: ['researcher', 'ai-academic', 'course-student'],
    subscribed: true,
    addedAt: new Date('2025-01-06')
  },
  {
    id: '7',
    name: 'Alex Thompson',
    email: 'alex@freelancer.com',
    tags: ['freelancer', 'content-creator', 'ai-tools'],
    subscribed: true,
    addedAt: new Date('2025-01-07')
  },
  {
    id: '8',
    name: 'Maria Garcia',
    email: 'maria.garcia@consultant.com',
    tags: ['consultant', 'business-owner', 'ai-enthusiast'],
    subscribed: true,
    addedAt: new Date('2025-01-08')
  }
];