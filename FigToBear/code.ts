// Interface for FrameDetails
interface FrameDetails {
  background: string;
  hasComponents: boolean;
  hasGroups: boolean;
  elements: FrameElement[];
}
// Interface for frame Elements
interface FrameElement {
  type: string;
  text ? : string;
  color ? : SolidPaint;
  fillType ? : string;
  fillDetails?: any; // Define a specific type for fill details if needed
}
type GetNodeType = 'COMPONENT' | 'GROUP';

//Load the UI
figma.showUI(__html__, {
  width: 320,
  height: 400,
  title: 'Figma to Bareconnect',
  themeColors: true
})


// Listen for messages from the HTML
figma.ui.onmessage = (msg) => {
  if (msg.type === 'getFrames') {
    const frames = figma.currentPage.findAll(node => node.type === 'FRAME');
    const frameNames = frames.map(frame => frame.name);
    figma.ui.postMessage({
      type: 'FRAMES_LIST',
      frameNames
    })
  } else if (msg.type == 'actionExit') {
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

      // Get frame details and send them back to the UI
      // Add a type assertion to ensure TypeScript knows it's a FrameNode
      const frameNode = frame as FrameNode;
      const frameDetails = {
        background: getBackgroundType(frameNode),
        hasComponents: hasComponentsOrGroups(frameNode, 'COMPONENT'),
        hasGroups: hasComponentsOrGroups(frameNode, 'GROUP'),
        elements: getElementsInFrame(frameNode),
      };
      console.log('Frame details:', frameDetails);

      // Send frame details back to the UI
      figma.ui.postMessage({
        type: 'FRAME_DETAILS',
        frameDetails
      });


    } else {
      console.error(`Frame "${frameName}" not found.`);
    }
  }

  // Function to get the type of background of a frame
  function getBackgroundType(frameNode: FrameNode): string {
    const fills = frameNode.backgrounds;
    if (fills.length === 0) {
      return 'None';
    } else if (fills.length === 1 && fills[0].type === 'SOLID') {
      return 'Solid Color';
    } else if (fills.length === 1 && fills[0].type === 'GRADIENT_LINEAR') {
      return 'Gradient';
    } else if (fills.length === 1 && fills[0].type === 'IMAGE') {
      return 'Image';
    } else {
      return 'Mixed';
    }
  }
  // Function to check if a frame node contains components or groups
  function hasComponentsOrGroups(frameNode: FrameNode, nodeType: NodeType): boolean {
    return frameNode.findAll(node => node.type === nodeType).length > 0;
  }
  // Function to get all elements within a frame node
  function getElementsInFrame(frameNode: FrameNode): FrameElement[] {
    const elements: FrameElement[] = [];
    let element: FrameElement | null = null;

    function traverse(node: SceneNode): void {
      if (node.type === 'TEXT') {
        elements.push({
          type: 'TEXT',
          text: (node as TextNode).characters
        });
      } else if (node.type === 'RECTANGLE') {
        const rectangle = node as RectangleNode;
        const fills = (rectangle.fills as SolidPaint[]);
        let fillType: string;
        let fillDetails: any;
        if (fills.length === 0) {
          fillType = 'None';
        } else {
          const fill = fills[0]
          if (fill.type === 'SOLID') {
            fillType = 'Solid Color';
            fillDetails = { color: (fill as SolidPaint).color };
            element = {
              type: 'RECTANGLE',
              fillType:'Solid'
            };
          } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
            element = {
              type: 'RECTANGLE',
              fillType: 'Gradient',
              // fillDetails = { gradientStops: (fill as GradientPaint).gradientStops };
            };
            
          } else if (fill.type === 'IMAGE') {
            element = {
              type: 'RECTANGLE',
              fillType: 'Image',
              // fillDetails = { image: (fill as ImagePaint).scaleMode };
            };
          } else {
            element = {
              type: 'RECTANGLE',
              fillType: 'Unknown'
            };
            // elements.push({
            //   type: 'RECTANGLE', fillType:'Unkown'
            // })
          }
        }
        if (element) {
          elements.push(element);
        }
      } else if (node.type === 'ELLIPSE') {
        elements.push({
          type: 'ELLIPSE'
        })
      }
      
      if ('children' in node) {
        (node as FrameNode).children.forEach(child => traverse(child));
      }
    }
    frameNode.children.forEach(child => traverse(child));
    return elements;

  };

}