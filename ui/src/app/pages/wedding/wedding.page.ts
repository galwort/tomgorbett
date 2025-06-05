import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
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
  selectedTags: string[] = [];
  tagsData: Record<string, string[]> = {};
  private continuationToken: string | undefined;
  private containerClient: ContainerClient | undefined;
  private allBlobs: any[] = []; // Cache all available blobs
  private hasLoadedAllBlobs = false;

  constructor(public tagService: WeddingTagsService) {}
  ngOnInit() {
    const blobServiceClient = new BlobServiceClient(
      `https://gorbettwedding.blob.core.windows.net?sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-12-31T11:24:38Z&st=2025-04-03T02:24:38Z&spr=https&sig=Iw8FjCPMzEqaAMvOeWJeGSvWg%2Fytzf%2FG2%2FohggssoVs%3D`
    );
    this.containerClient = blobServiceClient.getContainerClient('photos');
    this.loadAllBlobs().then(() => {
      this.loadMorePhotos();
    });
    this.tagService.getTags().subscribe((d) => {
      this.tagsData = d;
      if (this.selectedTags.length > 0 && this.photos.length === 0) {
        this.loadMorePhotos();
      }
    });
  }

  async loadAllBlobs() {
    if (!this.containerClient || this.hasLoadedAllBlobs) {
      return;
    }

    try {
      this.allBlobs = [];
      const pages = this.containerClient.listBlobsFlat().byPage();

      for await (const page of pages) {
        this.allBlobs.push(...page.segment.blobItems);
      }

      this.hasLoadedAllBlobs = true;
    } catch (error) {
      console.error('Error loading all blobs:', error);
    }
  }
  async loadMorePhotos(event?: any) {
    if (!this.containerClient || !this.hasLoadedAllBlobs) {
      if (event) event.target.complete();
      return;
    }

    try {
      const filteredBlobs = this.getFilteredBlobs();

      const currentPhotoCount = this.photos.length;
      const blobsToLoad = filteredBlobs.slice(
        currentPhotoCount,
        currentPhotoCount + 30
      );

      for (const blob of blobsToLoad) {
        const blobUrl = this.containerClient.getBlobClient(blob.name).url;
        this.photos.push({ name: blob.name, blobUrl });
      }

      if (currentPhotoCount + blobsToLoad.length >= filteredBlobs.length) {
        if (event) {
          event.target.disabled = true;
        }
      }

      if (event) event.target.complete();
    } catch (error) {
      console.error('Error loading photos:', error);
      if (event) event.target.complete();
    }
  }

  getFilteredBlobs() {
    if (this.selectedTags.length === 0) {
      return this.allBlobs;
    }

    return this.allBlobs.filter((blob) =>
      this.selectedTags.every((tag) => this.isTagged(tag, blob.name))
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

  ngOnDestroy() {}

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
  toggleFilter(tag: string) {
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter((t) => t !== tag);
    } else {
      this.selectedTags = [...this.selectedTags, tag];
    }

    this.photos = [];
    this.loadMorePhotos();

    const infiniteScroll = document.querySelector('ion-infinite-scroll');
    if (infiniteScroll) {
      (infiniteScroll as any).disabled = false;
    }
  }

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
