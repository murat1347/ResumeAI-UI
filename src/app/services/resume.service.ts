import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  Candidate,
  ConfigureLLMRequest,
  LLMStatusResponse,
  LLMConfigResponse,
  SessionResponse,
  UploadResponse,
  AnalysisResult
} from '../models/resume.models';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api/resume';

  // LLM Configuration
  configureLLM(request: ConfigureLLMRequest): Observable<{ success: boolean; message: string; provider?: string; model?: string }> {
    return this.http.post<{ success: boolean; message: string; provider?: string; model?: string }>(`${this.baseUrl}/configure`, request);
  }

  getLLMStatus(): Observable<LLMStatusResponse> {
    return this.http.get<LLMStatusResponse>(`${this.baseUrl}/llm-status`);
  }

  getLLMConfig(): Observable<LLMConfigResponse> {
    return this.http.get<LLMConfigResponse>(`${this.baseUrl}/llm-config`);
  }

  // Session Management
  createSession(): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.baseUrl}/session`, {});
  }

  clearSession(sessionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/session/${sessionId}`);
  }

  // Resume Upload
  uploadResumes(sessionId: string, files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    return this.http.post<UploadResponse>(`${this.baseUrl}/upload/${sessionId}`, formData);
  }

  // Candidates
  getCandidates(sessionId: string): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.baseUrl}/candidates/${sessionId}`);
  }

  // Analysis
  analyzeCandidates(sessionId: string, request: AnalyzeRequest): Observable<AnalyzeResponse> {
    return this.http.post<AnalyzeResponse>(`${this.baseUrl}/analyze/${sessionId}`, request);
  }

  getResults(sessionId: string): Observable<AnalysisResult[]> {
    return this.http.get<AnalysisResult[]>(`${this.baseUrl}/results/${sessionId}`);
  }

  getTopCandidates(sessionId: string, count: number = 10): Observable<AnalysisResult[]> {
    return this.http.get<AnalysisResult[]>(`${this.baseUrl}/top-candidates/${sessionId}?count=${count}`);
  }
}
