import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { MarkdownModule } from 'ngx-markdown';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.page.html',
  styleUrls: ['./blog-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    MarkdownModule,
  ],
})
export class BlogDetailPage implements OnInit {
  blogId: string = '';
  blogTitle: string = '';
  blogContent: string = '';
  blogPublished: string = '';
  blogImage: string = '';

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.blogId = this.route.snapshot.paramMap.get('id') || '';
    if (this.blogId) {
      await this.fetchBlogDetails();
    }
  }

  async fetchBlogDetails() {
    const blogDoc = doc(db, 'blogs', this.blogId);
    const snapshot = await getDoc(blogDoc);

    if (snapshot.exists()) {
      const data = snapshot.data();
      this.blogTitle = data['title'] || '';
      this.blogContent = (data['content'] || '').replace(/\\n/g, '\n\n');
      const publishedDate = data['published'].toDate();
      this.blogPublished = publishedDate.toLocaleDateString();
      this.blogImage = `assets/blog-images/${this.blogId}.png`;
    }
  }
}
