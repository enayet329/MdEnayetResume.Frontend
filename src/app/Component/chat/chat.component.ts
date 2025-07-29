// chat.component.ts

import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../Services/chat.service';
import { ChatRequest } from '../../Models/chat-request.model';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
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

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.messages.push({
      id: this.generateId(),
      content: "Hey! I'm Enayet, a software developer from Dhaka. What's up?",
      isUser: false,
      timestamp: new Date()
    });
    this.createParticles();
    setInterval(() => this.createParticles(), 10000);
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
      container.scrollTop = container.scrollHeight;
    }
  }

  private createParticles(): void {
    const particlesContainer = document.querySelector('.bg-particles');
    if (!particlesContainer) return;
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = particle.style.height = (Math.random() * 4 + 2) + 'px';
        particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(particle);
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 25000);
      }, i * 100);
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
    }, 1000);
    const req: ChatRequest = { userMessage: userMessageContent };
    this.chatService.streamChat(req).subscribe({
      next: (chunks: string[]) => {
        const fullText = chunks.join('').trim();
        if (this.currentStreamingMessage) {
          this.currentStreamingMessage.content = fullText;
        }
      },
      error: (err) => {
        console.error('Chat error:', err);
        if (this.currentStreamingMessage) {
          this.currentStreamingMessage.content = '⚠️ Sorry, something went wrong. Please try again.';
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
}