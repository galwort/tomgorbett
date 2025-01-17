import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.page.html',
  styleUrls: ['./blog-detail.page.scss'],
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
      this.blogContent = data['content'] || '';
      const publishedDate = data['published'].toDate();
      this.blogPublished = publishedDate.toLocaleDateString();
      this.blogImage = `assets/blog-images/${this.blogId}.png`;
    }
  }
}
