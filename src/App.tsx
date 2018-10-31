import * as React from "react";
import Button from "@material-ui/core/Button";
import { CssBaseline, AppBar, Card, Drawer, Toolbar, IconButton, Typography, List, ListItem, ListItemText, CardContent, Grid, CardHeader, Avatar, LinearProgress, ListItemIcon } from "@material-ui/core";
import { CloudUpload, CloudDownload, Menu } from "@material-ui/icons";
import DrawingCanvas from "./DrawingCanvas";
import * as tf from "@tensorflow/tfjs";
import { buildNeuralNet } from "./cnn";
import { CustomCallbackConfig } from "@tensorflow/tfjs";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface AppState { 
  open: boolean, 
  char: string, 
  numCaptured: number, 
  epoch: number, 
  loss: number, 
  trained: boolean,
  training: boolean,
};

export default class Add extends React.Component<{}, AppState> {
  private drawing = React.createRef<DrawingCanvas>();
  
  private trainingData : ImageData[] = [];
  private trainingLabels : number[] = [];
  private neuralNet : tf.Model = buildNeuralNet(ALPHABET.length);
  
  state = { 
    open: false, 
    char: this.randomChar(), 
    numCaptured: 0, 
    epoch: -1, 
    loss: 1, 
    training: false,
    trained: false,
  };

  private open = () => this.setState({ open: true });
  private close = () => this.setState({ open: false });

  private clear = () => this.drawing.current.clear();
  
  private next = () => {
    const drawing = this.drawing.current;
    this.trainingData.push(drawing.capture());
    this.trainingLabels.push(ALPHABET.indexOf(this.state.char));
    drawing.clear();
    this.setState({ char: this.randomChar(), numCaptured: this.state.numCaptured + 1 });
  };

  private train = async () => {
    this.setState({ training: true });

    const callbacks : CustomCallbackConfig = {
      onEpochEnd: async (epoch, logs) => {
        this.setState({ epoch, loss: logs.loss });
      }
    };

    await this.neuralNet.fit(
      tf.tidy(() => tf.stack(this.trainingData.map(img => tf.fromPixels(img,1)))), 
      tf.oneHot(this.trainingLabels, ALPHABET.length),
      { epochs: 100, callbacks });

    this.setState({ training: false, trained: true });
  };

  private predict = async () => {
    const drawing = this.drawing.current;
    const prediction : any = this.neuralNet.predict(tf.tidy(() => tf.stack([tf.fromPixels(drawing.capture(), 1)])));
    drawing.clear();

    const predictionValues = await prediction.data();

    let maxValue = 0;
    let maxIndex = -1;
    for (let i = 0; i < ALPHABET.length; i++) {
      if (predictionValues[i] > maxValue) {
        maxValue = predictionValues[i];
        maxIndex = i;
      }
    }

    alert(`Prediction: ${ALPHABET[maxIndex]}`);
  };

  private loadModel = async () => {
    const model = await tf.loadModel("localstorage://handwriting-model");
    model.compile({ loss: "categoricalCrossentropy", optimizer: "adam" });
    this.neuralNet = model;
    alert("Model Loaded");
  };

  private saveModel = async () => {
    await this.neuralNet.save("localstorage://handwriting-model");
    alert("Model Saved");
  }


  private randomChar() {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  render() {
    const progress = Math.min(100,this.state.numCaptured);

    return <React.Fragment>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <IconButton onClick={this.open}>
            <Menu />
          </IconButton>
          <Typography component="h1" variant="h6">TFJS Image</Typography>
        </Toolbar>
      </AppBar>
      <Drawer open={this.state.open} onBackdropClick={this.close}>
        <List style={{minWidth: "300px"}}>
          <ListItem button onClick={this.loadModel}>
            <ListItemIcon><CloudUpload /></ListItemIcon>
            <ListItemText>Load</ListItemText>
          </ListItem>
          <ListItem button onClick={this.saveModel}>
            <ListItemIcon><CloudDownload /></ListItemIcon>
            <ListItemText>Save</ListItemText>
          </ListItem>
        </List>
      </Drawer>
      <Grid component="main" container style={{marginTop: "56px"}}>
        <Grid item xs={12} style={{padding: "10px"}}>
          <Card>
            <CardContent>
              <Typography component="h2" variant="headline">Train</Typography>
              <Typography component="p">Write the letter that appears below in your own handwriting</Typography>
              <Avatar style={{width:60, height:60, margin: "10px auto"}}>{this.state.char}</Avatar>
              <LinearProgress style={{marginBottom: "10px" }} variant="determinate" value={progress} />
              <DrawingCanvas size={28} ref={this.drawing}/>
              <div style={{marginTop: "10px"}}>
                <Button onClick={this.clear} style={{marginRight: "10px"}} variant="contained">Clear</Button>
                <Button onClick={this.next} style={{marginRight: "10px"}} variant="contained">Next</Button>
                <Button onClick={this.train} style={{marginRight: "10px"}} disabled={this.state.training} variant="contained">Train</Button>
                <Button onClick={this.predict} disabled={!this.state.trained} variant="contained">Predict</Button>
              </div>
              {this.state.epoch >= 0 ? <Typography>Epoch: {this.state.epoch} / Loss: {this.state.loss.toFixed(3)}</Typography> : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>;
  }
}