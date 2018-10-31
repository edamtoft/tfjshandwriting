import * as tf from "@tensorflow/tfjs";

export function buildNeuralNet(classes: number) : tf.Model {
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
    units: classes, 
    activation: "softmax",
    kernelInitializer: "VarianceScaling"
  }));

  model.compile({ loss: "categoricalCrossentropy", optimizer: "adam" });
  
  return model;
};