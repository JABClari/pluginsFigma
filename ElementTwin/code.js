function runPlugin(){

  //Get the number of selected Elements
  let selectedElCount = figma.currentPage.selection.length;

  //Display Error Code if no element is selected or more than 1 selected
  if(selectedElCount === 0){
    figma.closePlugin('Please Select an element')
    return
  }
  if(selectedElCount > 1){
    figma.closePlugin('Please Select a single element')
    return
  }

  // Lets get the name of the select element
  let selectedElName =  figma.currentPage.selection[0].name;

  //Find all elements with the same name and select
  function hasSameName(node){
    return node.name === selectedElName;
  }

  let selectAllElWithSameName = figma.currentPage.findAll(hasSameName);
  figma.currentPage.selection =  selectAllElWithSameName;

  console.log(selectedElCount, selectedElName, selectAllElWithSameName.length);

  figma.closePlugin(selectAllElWithSameName.length + ' ' +'Elements selected with Same name');
  return
}

runPlugin();