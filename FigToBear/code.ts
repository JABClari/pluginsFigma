// Interface for FrameDetails
interface FrameDetails {
  background: string;
  hasComponents: boolean;
  hasGroups: boolean;
  elements: FrameElement[];
}
// Interface for text properties
interface TextProperties {
  alignment: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  fontSize: any;
  fontName: string;
  fontWeight: any;
  letterSpacing: any;
  lineHeight: any;
  color:any;
}

// Interface for frame Elements
interface FrameElement {
  type: string;
  text ? : string;
  color ? : SolidPaint;
  fillType ? : string;
  fillDetails?: any; // Define a specific type for fill details if needed
  textProperties?: TextProperties; // Add this line
}



type GetNodeType = 'COMPONENT' | 'GROUP';


// Function to generate JSON object with frame names
function generateFrameNamesJSON(): any {
  const frameNames: string[] = [];
  figma.currentPage.findAll(node => {
    if (node.type === 'FRAME') {
      frameNames.push(node.name);
    }
    return false; // Return false to indicate that we don't want to stop the iteration
  });
  return { frameNames };
}


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
    // Generate JSON object with frame names
    const frameNamesJSON = generateFrameNamesJSON();
    // Log the JSON object to the console
    console.log(JSON.stringify(frameNamesJSON, null, 2));
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
        const textNode = node as TextNode;
        const textProperties: TextProperties = {
          alignment: textNode.textAlignHorizontal,
          fontSize: textNode.fontSize,
          fontName: (textNode.fontName as FontName).family,
          lineHeight: textNode.lineHeight,
          letterSpacing: textNode.letterSpacing,
          color: textNode.fills,
          fontWeight: textNode.fontWeight,
        };
        elements.push({
          type: 'TEXT',
          text: textNode.characters,
          textProperties: textProperties
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
              fillType:'Solid',
              fillDetails
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
      }else if (node.type === 'POLYGON') {
        elements.push({
          type: 'POLYGON'
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