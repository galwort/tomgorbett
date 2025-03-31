import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.page.html',
  styleUrls: ['./blog-detail.page.scss'],
})
export class BlogDetailPage implements OnInit {
  blogId: string = '';
  title: string = '';
  contentHtml: string = '';
  publishedDate: string = '';
  imageUrl: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.blogId = this.route.snapshot.paramMap.get('id') || '';
    if (this.blogId) {
      this.fetchBlog();
    }
  }

  async fetchBlog() {
    const app = initializeApp(environment.firebase);
    const db = getFirestore(app);
    const docRef = doc(db, 'blogs', this.blogId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      this.title = data['title'] || '';
      const rawMarkdown = data['content'] || '';
      const replacedMarkdown = rawMarkdown.replace(/\\n/g, '\n');
      this.contentHtml = this.convertMarkdownToHtml(replacedMarkdown);
      const publishedTimestamp = data['published'];
      if (publishedTimestamp && publishedTimestamp.seconds) {
        const date = new Date(publishedTimestamp.seconds * 1000);
        this.publishedDate = date.toLocaleDateString();
      }
      this.imageUrl = 'assets/blog-images/' + this.blogId + '.png';
    }
  }

  convertMarkdownToHtml(markdown: string): string {
    let html = markdown;
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gm, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/gm, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }
}
