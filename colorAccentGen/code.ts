// Create a tint of color showed in a frame with autolayout

figma.showUI(__html__, 
  {
    width:360,
    height:540,
    title:"Color Tint Generator"
  }
)

//Receive message from UI
figma.ui.onmessage = msg =>{
  if(msg.type === 'actionGenerate'){
    //Destructure the form to use as variables
    const{circleSize,circleSpacing,colorCode,colorName, frameDirection,tintNumber}= msg.formDataObject;
    console.log(msg.formDataObject);

    //create the frame for the tint
    const parentFrame = figma.createFrame();
    parentFrame.name = 'Tints for the ' + colorName + ' color ';
    //Adding autolayout to the frame with direction, padding and spacing
    parentFrame.layoutMode = frameDirection.toUpperCase();

    parentFrame.paddingLeft = 64;
    parentFrame.paddingRight = 64;
    parentFrame.paddingTop = 64;
    parentFrame.paddingBottom = 64;

    parentFrame.itemSpacing = parseInt(circleSpacing);

    parentFrame.primaryAxisSizingMode = 'AUTO';
    parentFrame.counterAxisSizingMode = 'AUTO';

    //Generate the color tints as ellipses

    for(let i =0; i< tintNumber; i++){
      const tintNode = figma.createEllipse();

      //Name the layer
      tintNode.name = colorName + ' ' + (100 - i*10);
      
      //Size the layer
      tintNode.resize(parseInt(circleSize), parseInt(circleSize));
      function hexToRGB(hex:any) {
        hex = hex.replace(/^#/, '');
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
    
        return { r: r, g: g, b: b };
    }

      const colorR = hexToRGB(colorCode).r/255,
            colorG = hexToRGB(colorCode).g/255,
            colorB = hexToRGB(colorCode).b/255
 
      //Color the layer
      tintNode.fills =[{type:'SOLID', color:{r:colorR,g:colorG,b:colorB}}]

      //Set layer opacity
      tintNode.opacity =  (100-i*10)/100

      //Add generated nodes to the parent Frame
      parentFrame.appendChild(tintNode);

      //Select and Zoom to the generated Frame
      const selectFrame : FrameNode[] = []
      selectFrame.push(parentFrame);

      figma.currentPage.selection = selectFrame;
      figma.viewport.scrollAndZoomIntoView(selectFrame);
    }

    figma.closePlugin('Tints generated successfully');
  } else if(msg.type === 'actionExit'){
    figma.closePlugin('Color generation Cancelled')
  }
}



// figma.closePlugin('Thank you for using Color Tint Gen')