import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import Delaunator from 'delaunator';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild('triangleCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private points: number[][] = [];
  private width!: number;
  private height!: number;
  private baseColor: [number, number, number] = [0, 0, 0];

  ngOnInit() {
    this.initCanvas();
    this.generatePoints();
    this.drawTriangles();
  }

  private initCanvas() {
    const context = this.canvas.nativeElement.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.nativeElement.width = this.width;
    this.canvas.nativeElement.height = this.height;
  }

  private generatePoints() {
    const spacing = 100;
    for (let x = 0; x < this.width + spacing; x += spacing) {
      for (let y = 0; y < this.height + spacing; y += spacing) {
        this.points.push([
          x + (Math.random() - 0.5) * spacing,
          y + (Math.random() - 0.5) * spacing
        ]);
      }
    }
    this.points.push([0, 0], [this.width, 0], [0, this.height], [this.width, this.height]);
  }

  private isTriangleInTargetArea(points: number[][]): boolean {
    const centroidX = (points[0][0] + points[1][0] + points[2][0]) / 3;
    const centroidY = (points[0][1] + points[1][1] + points[2][1]) / 3;
    
    const targetX = this.width * 0.5;
    const targetY = this.height * 0.5;
    const targetWidth = this.width * 0.4;
    const targetHeight = this.height * 0.4;
    
    return centroidX > targetX && 
           centroidX < targetX + targetWidth && 
           centroidY > targetY && 
           centroidY < targetY + targetHeight;
  }

  private drawTriangles() {
    const coordinates = this.points.reduce((acc, point) => acc.concat(point), []);
    const delaunay = new Delaunator(coordinates);
    const triangles = delaunay.triangles;
    
    this.generateRandomBaseColor();
    
    // Create a map to store edge counts
    const edgeMap = new Map<string, number>();
    const edgeToPoints = new Map<string, [number[], number[]]>();

    // First pass: draw all triangles and count edges
    for (let i = 0; i < triangles.length; i += 3) {
      const points = [
        [coordinates[triangles[i] * 2], coordinates[triangles[i] * 2 + 1]],
        [coordinates[triangles[i + 1] * 2], coordinates[triangles[i + 1] * 2 + 1]],
        [coordinates[triangles[i + 2] * 2], coordinates[triangles[i + 2] * 2 + 1]]
      ];
      
      this.drawTriangle(points);
      
      if (this.isTriangleInTargetArea(points)) {
        // For each edge in the triangle
        for (let j = 0; j < 3; j++) {
          const p1 = points[j];
          const p2 = points[(j + 1) % 3];
          
          // Create a unique key for this edge
          const edgeKey = [
            Math.min(p1[0], p2[0]),
            Math.min(p1[1], p2[1]),
            Math.max(p1[0], p2[0]),
            Math.max(p1[1], p2[1])
          ].join(',');
          
          edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
          edgeToPoints.set(edgeKey, [p1, p2]);
        }
      }
    }
    
    // Draw only edges that appear once (boundary edges)
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    
    edgeMap.forEach((count, edge) => {
      if (count === 1) {
        const [p1, p2] = edgeToPoints.get(edge)!;
        this.ctx.moveTo(p1[0], p1[1]);
        this.ctx.lineTo(p2[0], p2[1]);
      }
    });
    
    this.ctx.stroke();
  }

  private generateRandomBaseColor() {
    const hue = Math.random() * 360;
    const saturation = 70;
    const lightness = 8;
    
    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
      h /= 360;
      s /= 100;
      l /= 100;
      
      let r, g, b;
      
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };
    
    this.baseColor = hslToRgb(hue, saturation, lightness);
  }

  private drawTriangle(points: number[][]) {
    const shade = 0.3 + Math.random() * 0.3;
    const color = this.baseColor.map(c => Math.round(c * shade));
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);
    this.ctx.lineTo(points[1][0], points[1][1]);
    this.ctx.lineTo(points[2][0], points[2][1]);
    this.ctx.closePath();
    
    this.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    this.ctx.fill();
  }
}