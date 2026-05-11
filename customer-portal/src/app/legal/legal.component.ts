import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LocalizationService } from '../shared/services/localization.service';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss']
})
export class LegalComponent implements OnInit {
  pageType: 'terms' | 'privacy' = 'terms';

  title = '';
  lastUpdated = '';

  sections: { heading: string; body: string }[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private localization: LocalizationService
  ) {}

  ngOnInit(): void {
    this.pageType = this.route.snapshot.data['page'] ?? 'terms';
    this.loadContent();
  }

  private loadContent(): void {
    this.localization.loadTranslations('en').subscribe(() => {
      const content = this.localization.getLegalContent(this.pageType);
      if (content) {
        this.title = content.title;
        this.lastUpdated = content.lastUpdated;
        this.sections = content.sections;
      }
      this.loading = false;
    });
  }
}
