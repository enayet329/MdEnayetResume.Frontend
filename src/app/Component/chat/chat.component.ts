import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../Services/chat.service';
import { ChatRequest } from '../../Models/chat-request.model';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translateY(40px) scale(0.9)' 
        }),
        animate('0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          style({ 
            opacity: 1, 
            transform: 'translateY(0) scale(1)' 
          })
        )
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('bounce', [
      state('normal', style({ transform: 'scale(1)' })),
      state('bounced', style({ transform: 'scale(1.1)' })),
      transition('normal => bounced', animate('0.2s ease-in')),
      transition('bounced => normal', animate('0.2s ease-out'))
    ])
  ]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  
  userMessage: string = '';
  messages: ChatMessage[] = [];
  isTyping: boolean = false;
  isSending: boolean = false;
  currentStreamingMessage: ChatMessage | null = null;
  selectedTab: number = 0;

  // Enhanced animation arrays with more particles for richer experience
  particles: number[] = Array.from({length: 80}, (_, i) => i);
  bubbles: number[] = Array.from({length: 35}, (_, i) => i);
  shapes: number[] = Array.from({length: 20}, (_, i) => i);
  stars: number[] = Array.from({length: 70}, (_, i) => i);

  // Typing text variations
  private typingTexts = [
    "Thinking deeply... 🤔",
    "Processing your request... ⚡",
    "Analyzing data, please wait... 📊",
    "Crafting the perfect response... ✨",
    "Almost there... 🚀",
    "Gathering information... 🔍",
    "Working on it... 💭"
  ];

  constructor(private chatService: ChatService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.setHeight();
    this.initializeChat();
    this.focusInput();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  @HostListener('window:resize')
  onResize() {
    this.setHeight();
  }

  private setHeight() {
    const container = document.querySelector('.chat-container') as HTMLElement;
    if (container) {
      container.style.height = `${window.innerHeight}px`;
    }
  }

  private initializeChat() {
    this.messages.push({
      id: this.generateId(),
      content: "Hey vai! I'm Enayet, a backend developer from Dhaka. Ready to chat about anything - tech, life, or whatever's on your mind! 😎✨",
      isUser: false,
      timestamp: new Date()
    });
  }

  private focusInput() {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 500);
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTo({ 
        top: container.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || this.isSending) return;
    
    const userMessageContent = this.userMessage.trim();
    const userMsg: ChatMessage = {
      id: this.generateId(),
      content: userMessageContent,
      isUser: true,
      timestamp: new Date()
    };
    
    this.messages.push(userMsg);
    this.userMessage = '';
    this.isSending = true;
    this.isTyping = true;

    // Auto-resize textarea
    this.resetTextareaHeight();

    const aiMsg: ChatMessage = {
      id: this.generateId(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    };

    setTimeout(() => {
      this.isTyping = false;
      this.messages.push(aiMsg);
      this.currentStreamingMessage = aiMsg;
    }, 1200 + Math.random() * 800); // Varied typing delay

    const req: ChatRequest = { userMessage: userMessageContent };
    this.chatService.streamChat(req).subscribe({
      next: (chunk: string) => {
        if (this.currentStreamingMessage) {
          this.currentStreamingMessage.content += chunk;
          this.scrollToBottom();
        }
      },
      error: (err) => {
        console.error('Chat error:', err);
        if (this.currentStreamingMessage) {
          this.currentStreamingMessage.content = '⚠️ Oops! Something went wrong, vai. Let\'s try that again! 😅';
          this.currentStreamingMessage.isStreaming = false;
        }
        this.resetChatState();
      },
      complete: () => {
        if (this.currentStreamingMessage) {
          this.currentStreamingMessage.isStreaming = false;
        }
        this.resetChatState();
        this.focusInput();
      }
    });
  }

  private resetChatState() {
    this.isSending = false;
    this.isTyping = false;
    this.currentStreamingMessage = null;
  }

  private resetTextareaHeight() {
    if (this.messageInput) {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = 'auto';
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInputChange(): void {
    // Auto-resize textarea
    if (this.messageInput) {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  renderMarkdown(content: string): SafeHtml {
    // Enhanced markdown rendering
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
    content = content.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');
    content = content.replace(/\n/g, '<br>');
    
    // Enhanced emoji and formatting
    content = content.replace(/(:\w+:)/g, '<span class="emoji">$1</span>');
    content = content.replace(/(\d+\.)/g, '<span class="list-number">$1</span>');
    
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  copyMessage(content: string): void {
    navigator.clipboard.writeText(content).then(() => {
      // Show toast notification (you can implement this)
      console.log('Message copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy message:', err);
    });
  }

  startNewChat(): void {
    this.messages = [];
    this.userMessage = '';
    this.resetChatState();
    this.selectedTab = 0;
    
    // Add welcome message with slight delay for better UX
    setTimeout(() => {
      this.initializeChat();
      this.focusInput();
    }, 300);
  }

  rerunMessage(message: ChatMessage): void {
    this.userMessage = message.content;
    this.sendMessage();
  }

  insertQuickMessage(message: string): void {
    this.userMessage = message;
    this.focusInput();
    // Optional: Auto-send after a short delay
    // setTimeout(() => this.sendMessage(), 500);
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    
    return timestamp.toLocaleDateString();
  }

  getRandomTypingText(): string {
    return this.typingTexts[Math.floor(Math.random() * this.typingTexts.length)];
  }

  // Enhanced animation methods
  getParticlePosition(index: number): number {
    return (index * 1.25) % 100;
  }

  getParticleDuration(index: number): number {
    return 12 + (index % 8) * 2;
  }

  getParticleSize(index: number): number {
    const sizes = [8, 10, 12, 14, 16];
    return sizes[index % sizes.length];
  }

  getBubblePosition(index: number): number {
    return (index * 2.8) % 100;
  }

  getBubbleDuration(index: number): number {
    return 18 + (index % 10) * 3;
  }

  getBubbleSize(index: number): number {
    const sizes = [25, 35, 45, 55, 65];
    return sizes[index % sizes.length];
  }

  getShapePosition(index: number): number {
    return (index * 5.2) % 100;
  }

  getShapeDuration(index: number): number {
    return 25 + (index % 6) * 5;
  }

  getShapeClass(index: number): string {
    const shapes = ['triangle', 'square', 'diamond'];
    return `shape ${shapes[index % shapes.length]}`;
  }

  getStarPosition(index: number): number {
    return (index * 1.4) % 100;
  }

  getStarDuration(index: number): number {
    return 35 + (index % 15) * 2;
  }
}