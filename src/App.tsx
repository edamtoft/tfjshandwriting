import * as React from "react";
import Button from "@material-ui/core/Button";
import { CssBaseline, AppBar, Card, Drawer, Toolbar, IconButton, Typography, List, ListItem, ListItemText, CardContent, Grid, CardHeader, Avatar, LinearProgress } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import DrawingCanvas from "./DrawingCanvas";
import * as tf from "@tensorflow/tfjs";
import { CustomCallbackConfig } from "@tensorflow/tfjs";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface AppState { 
  open: boolean, 
  char: string, 
  numCaptured: number, 
  epoch: number, 
  loss: number, 
  prediction: string,
  trained: boolean,
  training: boolean,
};

export default class Add extends React.Component<{}, AppState> {
  private drawing = React.createRef<DrawingCanvas>();
  
  private trainingData : tf.Tensor[] = [];
  private trainingLabels : number[] = [];
  private neuralNet : tf.Model = this.buildNeuralNet();
  
  state = { 
    open: false, 
    char: this.randomChar(), 
    numCaptured: 0, 
    epoch: -1, 
    loss: 1, 
    prediction: null,
    training: false,
    trained: false,
  };

  private open = () => this.setState({ open: true });
  private close = () => this.setState({ open: false });

  private clear = () => this.drawing.current.clear();
  
  private next = () => {
    const drawing = this.drawing.current;
    this.trainingData.push(tf.fromPixels(drawing.capture(28), 1));
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
      tf.stack(this.trainingData), 
      tf.oneHot(this.trainingLabels, ALPHABET.length),
      { epochs: 1000, callbacks });

    this.setState({ training: false, trained: true });
  };

  private predict = async () => {
    const drawing = this.drawing.current;
    const prediction = this.neuralNet.predict([tf.fromPixels(drawing.capture(28))]);
    drawing.clear();

    const predictionValues = await prediction[0].data();

    let maxValue = 0;
    let maxIndex = -1;
    for (let i = 0; i < ALPHABET.length; i++) {
      if (predictionValues[i] > maxValue) {
        maxValue = predictionValues[i];
        maxIndex = i;
      }
    }

    this.setState({ prediction: ALPHABET[maxIndex] });
  };

  private randomChar() {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  private buildNeuralNet() : tf.Model {
    const model = tf.sequential();
    
    model.add(tf.layers.conv2d({ 
      inputShape: [28,28,1],
      filters: 8, 
      kernelSize: 5,
      strides: 1, 
      activation: "relu",
      kernelInitializer: "VarianceScaling"
    }));
    
    model.add(tf.layers.maxPooling2d({ poolSize: [2,2], strides: [2,2] }));

    model.add(tf.layers.conv2d({ 
      filters: 16, 
      kernelSize: 5, 
      strides: 1, 
      activation: "relu",
      kernelInitializer: "VarianceScaling"
    }));

    model.add(tf.layers.maxPooling2d({ poolSize: [2,2], strides: [2,2] }));

    model.add(tf.layers.flatten());

    model.add(tf.layers.dense({ 
      units: ALPHABET.length, 
      activation: "softmax",
      kernelInitializer: "VarianceScaling"
    }));

    model.compile({ loss: "categoricalCrossentropy", optimizer: "adam" });
    
    return model;
  };

  render() {
    const progress = Math.min(100,this.state.numCaptured);

    return <React.Fragment>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <IconButton onClick={this.open}>
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h6">TFJS Image</Typography>
        </Toolbar>
      </AppBar>
      <Drawer open={this.state.open} onBackdropClick={this.close}>
        <List>
          <ListItem button><ListItemText>About</ListItemText></ListItem>
          <ListItem button><ListItemText>Train</ListItemText></ListItem>
          <ListItem button><ListItemText>Predict</ListItemText></ListItem>
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
              <DrawingCanvas ref={this.drawing}/>
              <div style={{marginTop: "10px"}}>
                <Button onClick={this.clear} style={{marginRight: "10px"}} variant="contained">Clear</Button>
                <Button onClick={this.next} style={{marginRight: "10px"}} variant="contained">Next</Button>
                <Button onClick={this.train} style={{marginRight: "10px"}} disabled={this.state.training} variant="contained">Train Now</Button>
                <Button onClick={this.predict} style={{marginRight: "10px"}} disabled={!this.state.trained} variant="contained">Predict</Button>
              </div>
              {this.state.epoch >= 0 ? <Typography>Epoch: {this.state.epoch} / Loss: {this.state.loss.toFixed(3)}</Typography> : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>;
  }
}