import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { HttpClient } from '@angular/common/http';
import { WeddingTagsService } from '../../services/wedding-tags.service';

interface Photo {
  name: string;
  blobUrl: string;
  loaded?: boolean;
  isPortrait?: boolean;
}

@Component({
  selector: 'app-wedding',
  templateUrl: './wedding.page.html',
  styleUrls: ['./wedding.page.scss'],
})
export class WeddingPage implements OnInit, OnDestroy {
  photos: Photo[] = [];
  isFullscreen = false;
  currentIndex = 0;
  searchQuery: string = '';
  selectedTag = '';
  activeIndex = 0;
  tagsData: Record<string, string[]> = {};
  private continuationToken: string | undefined;
  private containerClient: ContainerClient | undefined;

  constructor(
    private http: HttpClient,
    public tagService: WeddingTagsService
  ) {}

  ngOnInit() {
    const blobServiceClient = new BlobServiceClient(
      `https://gorbettwedding.blob.core.windows.net?sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-12-31T11:24:38Z&st=2025-04-03T02:24:38Z&spr=https&sig=Iw8FjCPMzEqaAMvOeWJeGSvWg%2Fytzf%2FG2%2FohggssoVs%3D`
    );
    this.containerClient = blobServiceClient.getContainerClient('photos');
    this.loadMorePhotos();
    this.tagService.getTags().subscribe((d) => {
      this.tagsData = d;
    });
    this.selectedTag = this.tagService.tags[0];
    window.addEventListener('keydown', this.tagKeyHandler);
  }

  async loadMorePhotos(event?: any) {
    if (!this.containerClient) {
      if (event) event.target.complete();
      return;
    }
    try {
      const pages = this.containerClient.listBlobsFlat().byPage({
        continuationToken: this.continuationToken,
        maxPageSize: 30,
      });
      const { done, value } = await pages.next();
      if (!done) {
        const segment = value.segment;
        for (const blob of segment.blobItems) {
          const blobUrl = this.containerClient.getBlobClient(blob.name).url;
          this.photos.push({ name: blob.name, blobUrl });
        }
        this.continuationToken = value.continuationToken;
      }
      if (event) event.target.complete();
    } catch {
      if (event) event.target.complete();
    }
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.loadMorePhotos(); // Reset to all photos if search query is empty
      return;
    }

    const apiUrl = 'https://fa-tom.azurewebsites.net/search';
    this.http
      .get<{ query: string; results: { url: string }[] }>(
        `${apiUrl}?q=${this.searchQuery}`
      )
      .subscribe(
        (response) => {
          this.photos = response.results.map((result) => ({
            name: '',
            blobUrl: result.url,
          }));
        },
        (error) => {
          console.error('Error fetching search results:', error);
        }
      );
  }

  onImageLoad(index: number, imgElement: HTMLImageElement) {
    const width = imgElement.naturalWidth;
    const height = imgElement.naturalHeight;
    this.photos[index].loaded = true;
    this.photos[index].isPortrait = height > width;
  }

  async downloadPhoto(blobUrl: string, fileName: string) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  openFullscreen(index: number) {
    this.isFullscreen = true;
    this.currentIndex = index;
    window.addEventListener('keydown', this.handleKeydown);
  }

  closeFullscreen() {
    this.isFullscreen = false;
    window.removeEventListener('keydown', this.handleKeydown);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.tagKeyHandler);
  }

  previousPhoto(event: MouseEvent) {
    event.stopPropagation();
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.photos.length - 1;
    }
  }

  nextPhoto(event: MouseEvent) {
    event.stopPropagation();
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
  }

  isTagged(tag: string, name: string) {
    return this.tagsData[tag]?.includes(name);
  }

  selectPhoto(index: number) {
    this.activeIndex = index;
  }

  toggleCurrent() {
    const photo = this.photos[this.activeIndex];
    if (!photo) return;
    this.toggleTag(photo.name);
  }

  toggleTag(name: string) {
    if (!this.selectedTag) return;
    const tagged = this.isTagged(this.selectedTag, name);
    this.tagsData[this.selectedTag] ||= [];
    this.tagService.toggle(this.selectedTag, name).subscribe(() => {
      if (tagged) {
        this.tagsData[this.selectedTag] = this.tagsData[
          this.selectedTag
        ].filter((n) => n !== name);
      } else {
        this.tagsData[this.selectedTag].push(name);
      }
    });
  }

  tagKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.photos.length;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.toggleCurrent();
    }
  };

  handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      this.previousPhoto(new MouseEvent('keydown'));
    } else if (event.key === 'ArrowRight') {
      this.nextPhoto(new MouseEvent('keydown'));
    } else if (event.key === 'Escape') {
      this.closeFullscreen();
    }
  };
}
