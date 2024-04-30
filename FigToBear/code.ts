//Load the UI
figma.showUI(__html__,{
  width: 320,
  height: 400,
  title: 'Figma to Bareconnect'
})


// Listen for messages from the HTML
figma.ui.onmessage = (msg) => {
  if (msg.type === 'getFrames') {

    const frames = figma.currentPage.findAll(node => node.type === 'FRAME');
    const frameNames = frames.map(frame => frame.name);
    figma.ui.postMessage({ type: 'FRAMES_LIST', frameNames })
  }else if(msg.type == 'actionExit'){
    figma.closePlugin('Thank you')
  }

  if (msg.type === 'selectFrame' && msg.frameName) {
    const frameName = msg.frameName;

    // Find the frame by its name
    const frame = figma.currentPage.findChild(node => node.type === 'FRAME' && node.name === frameName);

    if (frame) {
        // Deselect all nodes first to ensure only the selected frame is highlighted
        figma.currentPage.selection = [];
        // Select the frame
        figma.currentPage.selection = [frame];
        // Zoom to the selected frame
        figma.viewport.scrollAndZoomIntoView([frame]);
      
    } else {
        console.error(`Frame "${frameName}" not found.`);
    }
  }
};

