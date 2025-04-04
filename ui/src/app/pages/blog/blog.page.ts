import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

@Component({
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPage implements OnInit {
  blogs: { id: string; title: string }[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchBlogs();
  }

  async fetchBlogs() {
    const blogsRef = collection(db, 'blogs');
    const blogsQuery = query(blogsRef, orderBy('published', 'desc'));
    const snapshot = await getDocs(blogsQuery);

    this.blogs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data['title'],
      };
    });
  }

  navigateToBlog(id: string) {
    this.router.navigate([`/blog/${id}`]);
  }
}
