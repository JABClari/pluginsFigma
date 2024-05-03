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
  color: any;
}


// Interface for frame Elements
interface FrameElement {
  type: string;
  text?: string;
  color?: SolidPaint;
  fillType?: string;
  fillDetails?: any;
  textProperties?: TextProperties;
  elements?: FrameElement[];
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
          // Add a type assertion to ensure TypeScript knows it's a FrameNode
          const frameNode = frame as FrameNode;

          // Check if the frame is using Auto Layout
          const isAutoLayout = checkAutoLayout(frame);
          if (isAutoLayout) {
            const autoLayout = frameNode.layoutMode;
            let cssMode = '';
            if (isGroupNode(frameNode)) {
              if (frameNode.children.length === 1) {
                cssMode = 'column';
              } else {
                cssMode = 'row';
              }
              console.log('Group Node detected. Number of children:', frameNode.children.length, cssMode);
            } else{
            switch (autoLayout) {
                case 'HORIZONTAL':
                    cssMode = 'row';
                    break;
                case 'VERTICAL':
                    cssMode = 'column';
                    break;
                default:
                    cssMode = 'unknown';
                    break;
            }
          }
            console.log('Layout mode:', autoLayout, 'CSS Mode:', cssMode);
          } else {
            console.log('Not using Auto Layout');
          }

          // Get frame details and send them back to the UI
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

          // Generate JSON object with frame details
          const frameDetailsJSON = generateFrameDetailsJSON(frameNode);
          // Log the JSON object to the console
          console.log(JSON.stringify(frameDetailsJSON, null, 2));
      } else {
          console.error(`Frame "${frameName}" not found.`);
      }
  }
}

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

// Function to generate JSON object with frame details
// Function to generate JSON object with frame details
function generateFrameDetailsJSON(frameNode: FrameNode): any {
  const autoLayout = checkAutoLayout(frameNode);
  const layoutMode = autoLayout === 'None' ? 'NONE' : autoLayout.toUpperCase();
  const cssMode = autoLayout === 'None' ? 'unset' : frameNode.children.length === 1 ? 'column' : 'row';
  const childrenCount = frameNode.children.length;

  // Get gap between child nodes if using auto layout
  // let gap = 0;
  // if (autoLayout !== 'None') {
  //     gap = frameNode.layoutGrids && frameNode.layoutGrids.length > 0 ? frameNode.layoutGrids[0].spacing : 0;
  // }

  // Get elements within the frame
  const elements = getElementsInFrame(frameNode);

  // Get parent frame details
  const parentFrame = getParentFrameDetails(frameNode);

  return {
      [frameNode.name]: {
          autolayout: {
              enabled: autoLayout !== 'None',
              layoutMode: layoutMode,
              cssMode: cssMode,
              childrenCount: childrenCount,
              // gap: gap
          },
          ParentFrame: parentFrame,
          elements: elements
      }
  };
}

// Function to get parent frame details
function getParentFrameDetails(frameNode: FrameNode): any {
  const fills = frameNode.parent && frameNode.backgrounds;
  if (fills && fills.length > 0) {
      const fill = fills[0];
      if (fill.type === 'SOLID') {
          return {
              background: {
                  SOLID: {
                      filltype: 'gradient',
                      cssMode: `background-color: ${fill.color}`
                  }
              }
          };
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
          return {
              background: {
                  GRADIENT: {
                      filltype: 'gradient',
                      gradientType: fill.type === 'GRADIENT_LINEAR' ? 'LINEAR' : 'RADIAL',
                      cssMode: `background-image: `
                  }
              }
          };
      } else if (fill.type === 'IMAGE') {
          return {
              background: {
                  IMAGE: {
                      filltype: 'image',
                      cssMode: `background-image: url('')`
                  }
              }
          };
      }
  }
  return {
      background: {
          NONE: {
              filltype: 'none',
              cssMode: 'unset'
          }
      }
  };
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




/* Function to check if a frame is using Auto Layout
This is going help determine column / row positioning of items
*/
function checkAutoLayout(node: SceneNode): string {
  if ((node as FrameNode).layoutMode === 'NONE') {
    if (isGroupNode(node) && (node as FrameNode).children?.length === 1) {
      return 'column';
    } else {
      return 'None';
    }
  } else if ((node as FrameNode).layoutMode === 'HORIZONTAL') {
    return 'Horizontal';
  } else if((node as FrameNode).layoutMode === 'VERTICAL') {
    return 'Vertical';
  } else{
    return 'unknown'
  }
}


// Function to check if a node is a group
function isGroupNode(node: SceneNode): boolean {
  return node.type === 'GROUP';
}


// Function to check if a frame node contains components or groups
function hasComponentsOrGroups(frameNode: FrameNode, nodeType: NodeType): boolean {
  // return frameNode.findAll(node => node.type === nodeType).length > 0;
  if (nodeType === 'COMPONENT') {
    return frameNode.findAll(node => 'componentId' in node).length > 0;
  } else if (nodeType === 'GROUP') {
    return frameNode.findAll(node => node.type === 'GROUP' && node.children.length === 1).length > 0;
  }
  return false;
}

// Function to get all elements within a frame node
function getElementsInFrame(frameNode: FrameNode): { elements: FrameElement[], groups: { name: string, elements: FrameElement[], isMainGroup: boolean }[] } {
  const elements: FrameElement[] = [];
    let element: FrameElement | null = null;
    const groups: { name: string, elements: FrameElement[], isMainGroup: boolean }[] = [];

  function traverse(node: SceneNode, groupName:string | null,  isMainGroup: boolean): void {
      if (node.type === 'TEXT') {
          const textNode = node as TextNode;
          const textProperties: TextProperties = {
              alignment: textNode.textAlignHorizontal,
              fontName: (textNode.fontName as FontName).family,
              fontSize: textNode.fontSize,
              fontWeight: textNode.fontWeight,
              lineHeight: textNode.lineHeight,
              letterSpacing: textNode.letterSpacing,
              color: textNode.fills,
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
                      fillType: 'Solid',
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
      } else if (node.type === 'POLYGON') {
          elements.push({
              type: 'POLYGON'
          })
      } 
      else if (node.type === 'GROUP') {
        // Record the group name and process its children
        const groupNode = node as GroupNode;
        const currentGroupName = groupNode.name;
        const groupElements: FrameElement[] = [];
        if (groupNode.children) {
            groupNode.children.forEach(child => traverse(child, currentGroupName, false)); // Inner group, so isMainGroup is false
        }
        groups.push({ name: currentGroupName, elements: groupElements, isMainGroup });
    }
    

      // if ('children' in node) {
      //     (node as FrameNode).children.forEach(child => traverse(child, null));
      // }
      if ('children' in node && node.type !== 'GROUP') {
        // Traverse into children nodes if they are not groups
        frameNode.children.forEach(child => traverse(child, groupName, true));
    }
  
  }
  // Start traversing from the top-level children of the frame node
  frameNode.children.forEach(child => traverse(child, null, true)); 

  return { elements, groups };
};
