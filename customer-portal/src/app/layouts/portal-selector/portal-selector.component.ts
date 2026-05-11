import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-portal-selector',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portal-selector.component.html',
  styleUrls: ['./portal-selector.component.scss']
})
export class PortalSelectorComponent {}
