import { Component, OnInit } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

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
export class WeddingPage implements OnInit {
  photos: Photo[] = [];
  private continuationToken: string | undefined;
  private containerClient: ContainerClient | undefined;

  constructor() {}

  ngOnInit() {
    const blobServiceClient = new BlobServiceClient(
      `https://gorbettwedding.blob.core.windows.net?sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-12-31T11:24:38Z&st=2025-04-03T02:24:38Z&spr=https&sig=Iw8FjCPMzEqaAMvOeWJeGSvWg%2Fytzf%2FG2%2FohggssoVs%3D`
    );
    this.containerClient = blobServiceClient.getContainerClient('photos');
    this.loadMorePhotos();
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

  onImageLoad(index: number, imgElement: HTMLImageElement) {
    const width = imgElement.naturalWidth;
    const height = imgElement.naturalHeight;
    this.photos[index].loaded = true;
    this.photos[index].isPortrait = height > width;
  }

  downloadPhoto(blobUrl: string, fileName: string) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.target = '_blank';
    link.click();
  }
}
