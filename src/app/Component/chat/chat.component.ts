import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../Services/chat.service';
import { ChatRequest } from '../../Models/chat-request.model';
import { trigger, transition, style, animate } from '@angular/animations';
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
        style({ opacity: 0, transform: 'translateY(30px) scale(0.95)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
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
  suggestions: string[] = [
  "Give me a 60‑second intro to Enayet",
  "What are your top technical skills?",
  "What recent R&D have you done?",
  "What are you learning right now?",
  "What domains interest you next (OTA, fintech, etc.)?",
  "বাংলায় নিজের সম্পর্কে সংক্ষেপে বলুন",
  "আপনার পছন্দের টেক স্ট্যাক কী এবং কেন?"
  ];

  // Enhanced animations
  particles: number[] = Array.from({length: 60}, (_, i) => i);
  bubbles: number[] = Array.from({length: 25}, (_, i) => i);
  shapes: number[] = Array.from({length: 15}, (_, i) => i);
  stars: number[] = Array.from({length: 50}, (_, i) => i);

  constructor(private chatService: ChatService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.messages.push({
      id: this.generateId(),
      content: "Hey vai! I'm Enayet, a backend dev from Dhaka. What's up? 😎",
      isUser: false,
      timestamp: new Date()
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
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
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
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
      this.scrollToBottom();
    }, 800);

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
          this.currentStreamingMessage.content = '⚠️ Sorry, something went wrong, vai. Try again! 😅';
          this.currentStreamingMessage.isStreaming = false;
        }
        this.isSending = false;
        this.isTyping = false;
        this.currentStreamingMessage = null;
      },
      complete: () => {
        if (this.currentStreamingMessage) {
          this.currentStreamingMessage.isStreaming = false;
        }
        this.isSending = false;
        this.currentStreamingMessage = null;
        setTimeout(() => {
          if (this.messageInput) {
            this.messageInput.nativeElement.focus();
          }
        }, 100);
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  renderMarkdown(content: string): SafeHtml {
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/`(.*?)`/g, '<code>$1</code>');
    content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    content = content.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  copyMessage(content: string): void {
    navigator.clipboard.writeText(content);
  }

  startNewChat(): void {
    this.messages = [
      {
        id: this.generateId(),
        content: "Hey vai! I'm Enayet, a backend dev from Dhaka. What's up? 😎",
        isUser: false,
        timestamp: new Date()
      }
    ];
    this.userMessage = '';
    this.isTyping = false;
    this.isSending = false;
    this.currentStreamingMessage = null;
    this.selectedTab = 0;
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  rerunMessage(message: ChatMessage): void {
    this.userMessage = message.content;
    this.sendMessage();
  }

  sendSuggestion(suggestion: string): void {
    this.userMessage = suggestion;
    this.sendMessage();
  }

  getParticlePosition(index: number): number {
    return Math.random() * 100;
  }

  getParticleDuration(index: number): number {
    return 12 + Math.random() * 12;
  }

  getBubblePosition(index: number): number {
    return Math.random() * 100;
  }

  getBubbleDuration(index: number): number {
    return 18 + Math.random() * 18;
  }

  getShapePosition(index: number): number {
    return Math.random() * 100;
  }

  getShapeDuration(index: number): number {
    return 25 + Math.random() * 15;
  }

  getShapeClass(index: number): string {
    const shapes = ['triangle', 'square', 'diamond'];
    return `shape ${shapes[Math.floor(Math.random() * shapes.length)]}`;
  }

  getStarPosition(index: number): number {
    return Math.random() * 100;
  }

  getStarDuration(index: number): number {
    return 3 + Math.random() * 4;
  }

  adjustForKeyboard(): void {
    setTimeout(() => {
      this.scrollToBottom();
    }, 300); // Delay to allow keyboard to open
  }
}