import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumeService } from '../../services/resume.service';
import {
  Candidate,
  AnalysisResult,
  JobRequirement,
  LLMConfigResponse
} from '../../models/resume.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly resumeService = inject(ResumeService);

  // State
  llmConfig = signal<LLMConfigResponse | null>(null);
  apiKey = signal<string>('');
  isLLMConfigured = signal<boolean>(false);
  currentProvider = signal<string | null>(null);
  currentModel = signal<string | null>(null);
  
  sessionId = signal<string | null>(null);
  candidates = signal<Candidate[]>([]);
  results = signal<AnalysisResult[]>([]);
  
  isUploading = signal<boolean>(false);
  isAnalyzing = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  
  // Job Requirements Form
  jobRequirement = signal<JobRequirement>({
    jobTitle: '',
    description: '',
    requiredSkills: [],
    preferredSkills: [],
    minYearsOfExperience: 0,
    maxYearsOfExperience: undefined,
    requiredDegree: '',
    preferredFieldsOfStudy: [],
    skillsWeight: 40,
    experienceWeight: 40,
    educationWeight: 20
  });
  
  requiredSkillsInput = signal<string>('');
  preferredSkillsInput = signal<string>('');
  preferredFieldsInput = signal<string>('');
  
  // Messages
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  
  // Drag & Drop state
  isDragging = signal<boolean>(false);
  selectedFiles = signal<File[]>([]);
  
  // Computed
  hasResults = computed(() => this.results().length > 0);
  hasCandidates = computed(() => this.candidates().length > 0);
  canAnalyze = computed(() => 
    this.isLLMConfigured() && 
    this.hasCandidates() && 
    this.jobRequirement().jobTitle.trim() !== '' &&
    this.jobRequirement().requiredSkills.length > 0
  );

  // Current step
  currentStep = signal<number>(1);

  ngOnInit() {
    this.loadLLMConfig();
    this.checkLLMStatus();
  }

  loadLLMConfig() {
    this.resumeService.getLLMConfig().subscribe({
      next: (config) => {
        this.llmConfig.set(config);
        this.currentProvider.set(config.provider);
        this.currentModel.set(config.model);
      },
      error: (err) => this.showError('LLM yapılandırması yüklenemedi')
    });
  }

  checkLLMStatus() {
    this.resumeService.getLLMStatus().subscribe({
      next: (status) => {
        this.isLLMConfigured.set(status.isConfigured);
        this.currentProvider.set(status.currentProvider);
        this.currentModel.set(status.currentModel ?? null);
        if (status.isConfigured) {
          this.currentStep.set(2);
          this.createNewSession();
        }
      },
      error: () => this.isLLMConfigured.set(false)
    });
  }

  configureLLM() {
    if (!this.apiKey()) {
      this.showError('API anahtarı gerekli');
      return;
    }

    this.resumeService.configureLLM({
      apiKey: this.apiKey()
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess(response.message);
          this.isLLMConfigured.set(true);
          this.currentProvider.set(response.provider);
          this.currentStep.set(2);
          this.createNewSession();
        }
      },
      error: (err) => this.showError(err.error?.message || 'LLM yapılandırılamadı')
    });
  }

  createNewSession() {
    this.resumeService.createSession().subscribe({
      next: (response) => {
        this.sessionId.set(response.sessionId);
        this.candidates.set([]);
        this.results.set([]);
        this.selectedFiles.set([]);
      },
      error: (err) => this.showError('Oturum oluşturulamadı: ' + err.message)
    });
  }

  // File handling
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  handleFiles(files: File[]) {
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const validFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length !== files.length) {
      this.showError('Bazı dosyalar desteklenmiyor. Desteklenen formatlar: PDF, DOCX, DOC, TXT');
    }

    this.selectedFiles.update(current => [...current, ...validFiles]);
  }

  removeFile(index: number) {
    this.selectedFiles.update(current => current.filter((_, i) => i !== index));
  }

  uploadFiles() {
    if (!this.sessionId() || this.selectedFiles().length === 0) return;

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    this.resumeService.uploadResumes(this.sessionId()!, this.selectedFiles()).subscribe({
      next: (response) => {
        this.candidates.set(response.candidates);
        this.selectedFiles.set([]);
        this.isUploading.set(false);
        this.showSuccess(`${response.successfullyUploaded} CV başarıyla yüklendi`);
        
        if (response.errors.length > 0) {
          this.showError(response.errors.join('\n'));
        }
        
        this.currentStep.set(3);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.showError(err.error?.message || 'Yükleme başarısız');
      }
    });
  }

  // Job Requirements
  addRequiredSkill() {
    const skill = this.requiredSkillsInput().trim();
    if (skill) {
      this.jobRequirement.update(jr => ({
        ...jr,
        requiredSkills: [...jr.requiredSkills, skill]
      }));
      this.requiredSkillsInput.set('');
    }
  }

  removeRequiredSkill(index: number) {
    this.jobRequirement.update(jr => ({
      ...jr,
      requiredSkills: jr.requiredSkills.filter((_, i) => i !== index)
    }));
  }

  addPreferredSkill() {
    const skill = this.preferredSkillsInput().trim();
    if (skill) {
      this.jobRequirement.update(jr => ({
        ...jr,
        preferredSkills: [...jr.preferredSkills, skill]
      }));
      this.preferredSkillsInput.set('');
    }
  }

  removePreferredSkill(index: number) {
    this.jobRequirement.update(jr => ({
      ...jr,
      preferredSkills: jr.preferredSkills.filter((_, i) => i !== index)
    }));
  }

  addPreferredField() {
    const field = this.preferredFieldsInput().trim();
    if (field) {
      this.jobRequirement.update(jr => ({
        ...jr,
        preferredFieldsOfStudy: [...jr.preferredFieldsOfStudy, field]
      }));
      this.preferredFieldsInput.set('');
    }
  }

  removePreferredField(index: number) {
    this.jobRequirement.update(jr => ({
      ...jr,
      preferredFieldsOfStudy: jr.preferredFieldsOfStudy.filter((_, i) => i !== index)
    }));
  }

  updateJobTitle(event: Event) {
    const input = event.target as HTMLInputElement;
    this.jobRequirement.update(jr => ({ ...jr, jobTitle: input.value }));
  }

  updateDescription(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.jobRequirement.update(jr => ({ ...jr, description: textarea.value }));
  }

  updateMinExperience(event: Event) {
    const input = event.target as HTMLInputElement;
    this.jobRequirement.update(jr => ({ ...jr, minYearsOfExperience: parseInt(input.value) || 0 }));
  }

  updateMaxExperience(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    this.jobRequirement.update(jr => ({ ...jr, maxYearsOfExperience: isNaN(value) ? undefined : value }));
  }

  updateRequiredDegree(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.jobRequirement.update(jr => ({ ...jr, requiredDegree: select.value }));
  }

  updateSkillsWeight(event: Event) {
    const input = event.target as HTMLInputElement;
    this.jobRequirement.update(jr => ({ ...jr, skillsWeight: parseInt(input.value) || 40 }));
  }

  updateExperienceWeight(event: Event) {
    const input = event.target as HTMLInputElement;
    this.jobRequirement.update(jr => ({ ...jr, experienceWeight: parseInt(input.value) || 40 }));
  }

  updateEducationWeight(event: Event) {
    const input = event.target as HTMLInputElement;
    this.jobRequirement.update(jr => ({ ...jr, educationWeight: parseInt(input.value) || 20 }));
  }

  // Analysis
  startAnalysis() {
    if (!this.sessionId() || !this.canAnalyze()) return;

    this.isAnalyzing.set(true);

    this.resumeService.analyzeCandidates(this.sessionId()!, {
      jobRequirement: this.jobRequirement()
    }).subscribe({
      next: (response) => {
        this.results.set(response.results);
        this.isAnalyzing.set(false);
        this.showSuccess(`${response.successfullyAnalyzed} aday analiz edildi`);
        
        if (response.errors.length > 0) {
          this.showError(response.errors.join('\n'));
        }
        
        this.currentStep.set(4);
      },
      error: (err) => {
        this.isAnalyzing.set(false);
        this.showError(err.error?.message || 'Analiz başarısız');
      }
    });
  }

  // Utility
  showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  getScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  resetAndStartOver() {
    if (this.sessionId()) {
      this.resumeService.clearSession(this.sessionId()!).subscribe();
    }
    this.currentStep.set(1);
    this.sessionId.set(null);
    this.candidates.set([]);
    this.results.set([]);
    this.selectedFiles.set([]);
    this.jobRequirement.set({
      jobTitle: '',
      description: '',
      requiredSkills: [],
      preferredSkills: [],
      minYearsOfExperience: 0,
      maxYearsOfExperience: undefined,
      requiredDegree: '',
      preferredFieldsOfStudy: [],
      skillsWeight: 40,
      experienceWeight: 40,
      educationWeight: 20
    });
  }
}
