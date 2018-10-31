import * as React from "react";
import { Paper } from "@material-ui/core";

export default class DrawingCanvas extends React.Component {
  private prev: {x: number, y: number} = null;
  private canvas = React.createRef<HTMLCanvasElement>();

  private getCanvasPoint(e:React.TouchEvent<HTMLCanvasElement>) : {x: number, y: number} {
    const rect = this.canvas.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    return {x,y};
  }
  
  private startDrawing = (e:React.TouchEvent<HTMLCanvasElement>) => this.prev = this.getCanvasPoint(e);

  private stopDrawing = (e:React.TouchEvent<HTMLCanvasElement>) => this.prev = null;

  private draw = (e:React.TouchEvent<HTMLCanvasElement>) => {
      const current = this.getCanvasPoint(e);
      const prev = this.prev;
      this.prev = current;

      if (prev === null) {
        return;
      }

      const ctx = this.canvas.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
  };

  componentDidMount() {
    const canvas = this.canvas.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetWidth; // make square
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  public capture(size: number) : ImageData {
    const canvas = this.canvas.current;
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = size;
    resizedCanvas.height = size;
    const resizedContext = resizedCanvas.getContext("2d");
    resizedContext.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    return resizedContext.getImageData(0,0, canvas.width, canvas.height)
  }

  public clear() : void {
    const canvas = this.canvas.current;
    const { height, width } = canvas;
    canvas.getContext("2d").clearRect(0, 0, width, height);
  }

  render() {
    return <Paper>
      <canvas 
        ref={this.canvas}
        style={{width: "100%", touchAction: "none"}} 
        onTouchStart={this.startDrawing} 
        onTouchMove={this.draw} 
        onTouchEnd={this.stopDrawing} />
      </Paper> 
  }
}