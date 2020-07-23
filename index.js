//jshint esversion:6

/*************************
 Globals and Constants
 *************************/

const debug = false;

let canvas = $("#canvas").get(0);
let ctx = canvas.getContext("2d");

const penColors = {
  BLACK: "#000",
  RED: "#f00",
  BLUE: "#00f"
};
Object.freeze(penColors);

const toolModes = {
  DRAW: 0,
  ERASE: 1
};
Object.freeze(toolModes);

const cursors = {
  DEFAULT: "default-cursor",
  ERASE: "erase-cursor"
};
Object.freeze(cursors);

const pen = {
  width: 2,
  cursor: cursors.DEFAULT,
  color: penColors.BLACK
};

const eraser = {
  width: 24,
  cursor: cursors.ERASE
};


const activeTool = {
  pressed: false,
  mode: toolModes.DRAW,
  tool: pen,
};

/*************************
 Window Event Handlers
 *************************/

// Event listener for window load
$(window).on("load", function() {
  setCanvasDims();
  $(".canvas-container").css("display", "flex");
});

// OPTIMIZE:
// Make it so we only update canvas dimensions when there is a
// change to be made

// Event listener for window resize
$(window).on("resize", function() {
  updateCanvasDims();

  setTimeout(function() {
    updateCanvasDims();

  }, 300);

});

// TODO: Handle edge case of canvas that is too small

// Compute the largest possible canvas size
function computeCanvasDims() {
  // Get the max possible width and height for canvas
  let maxWidth = $(".content-inner").css("width");
  maxWidth = parseInt(maxWidth, 10);
  let maxHeight = $(".content-inner").css("height");
  maxHeight = parseInt(maxHeight, 10);

  // Set dimenions using max width as width and aspect ratio 3:2
  let newWidth = maxWidth;
  let newHeight = Math.floor(maxWidth * 0.66);

  // If height is too big, set dimensions using max height as height and aspect ratio 3:2
  if (newHeight >= maxHeight) {
    newWidth = Math.floor(maxHeight * 1.5);
    newHeight = maxHeight;
  }

  // Log messages for debugging
  if (debug) console.log("Content area: " + [newWidth, newHeight]);
  if (debug) console.log("Old canvas width:", canvas.width);
  if (debug) console.log("New canvas width:", newWidth);
  if (debug) console.log("Old canvas height:", canvas.height);
  if (debug) console.log("New canvas height:", maxHeight);

  return [newWidth, newHeight];
}

// Set the initial canvas dimensions
function setCanvasDims() {
  // Get dimenions for canvas based off viewport
  let dimensions = computeCanvasDims();
  let newWidth = dimensions[0];
  let newHeight = dimensions[1];

  // Set width and height of canvas
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Log mesages for debugging
  if (debug) console.log("Canvas set to: " + newWidth, newHeight);

}

// Update the canvas dimensions
function updateCanvasDims() {
  // Get dimenions for canvas based off viewport
  let dimensions = computeCanvasDims();
  let newWidth = dimensions[0];
  let newHeight = dimensions[1];

  // Copy image data from canvas to a new canvas
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var newCanvas = $("<canvas>")
    .attr("width", imageData.width)
    .attr("height", imageData.height)[0];

  newCanvas.getContext("2d").putImageData(imageData, 0, 0);

  // Compute scale ratio
  let xScale = newWidth / ctx.canvas.width;
  let yScale = newHeight / ctx.canvas.height;

  // Set new width and height to canvas
  ctx.canvas.width = newWidth;
  ctx.canvas.height = newHeight;

  // Rescale and redraw canvas
  ctx.scale(xScale, yScale);
  ctx.drawImage(newCanvas, 0, 0);
}

/*************************
 Canvas-related Mouse Event Handlers
 *************************/

// Mousedown event handler
$(canvas).on("mousedown", function(e) {
  let pos = getMouseCanvasPos(e);
  let x = pos[0];
  let y = pos[1];

  if (activeTool.mode === toolModes.DRAW) {
    activatePen();
    ctx.beginPath();
    ctx.rect(x, y, 1, 1);
    ctx.moveTo(x, y);
    ctx.stroke();
  } else if (activeTool.mode === toolModes.ERASE) {
    activeTool.pressed = true;
    ctx.clearRect(x - (activeTool.tool.width / 2), y - (activeTool.tool.width / 2), activeTool.tool.width, activeTool.tool.width);
  }

  if (debug) console.log("Mousedown:", pos);
});

// Mousemove event handler
$(canvas).on("mousemove", function(e) {
  if (activeTool.pressed) {
    let pos = getMouseCanvasPos(e);
    let x = pos[0];
    let y = pos[1];
    if (activeTool.mode === toolModes.DRAW) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool.mode === toolModes.ERASE) {
      ctx.clearRect(x - (activeTool.tool.width / 2), y - (activeTool.tool.width / 2), activeTool.tool.width, activeTool.tool.width);
    }

    if (debug) console.log("Mousemove:", pos);
  }


});

//Mouseup event handler
$(canvas).on("mouseup", function(e) {
  deactivatePen();

  if (debug) console.log("Mouseup:", getMouseCanvasPos(e));
});

// Gets the position of mouse from event
function getMouseCanvasPos(event) {
  let offsetLeft = canvas.getBoundingClientRect().left;
  let offsetTop = canvas.getBoundingClientRect().top;
  x = event.pageX - offsetLeft;
  y = event.pageY - offsetTop;
  return [x, y];
}

/*************************
 Canvas-related Touch Event Handlers
*************************/

// TODO: test on a mobile device

// Touchstart event handler
$(canvas).on("touchstart", function(e) {
  e.preventDefault();
  activatePen();
  ctx.beginPath();
  let pos = getTouchCanvasPos(e);
  let x = pos[0];
  let y = pos[1];
  ctx.rect(x, y, 1, 1);
  ctx.moveTo(x, y);
  ctx.stroke();

  if (debug) console.log("Touchstart:", pos);
});

// Touchmove event handler
$(canvas).on("touchmove", function(e) {
  if (activeTool.pressed) {
    e.preventDefault();
    let pos = getTouchCanvasPos(e);
    let x = pos[0];
    let y = pos[1];
    ctx.lineTo(x, y);
    ctx.stroke();

    if (debug) console.log("Touchmove:", pos);
  }
});

// Touchend event handler
$(canvas).on("touchend", function(e) {
  e.preventDefault();
  deactivatePen();

  console.log("Mouseup at " + getMouseCanvasPos(e));
});

// Scroll down to remove address bar and go full screen on mobile
$(".box").on("touchstart", function(e) {
  window.scrollTo(0, 1);
  if (debug) console.log("Mobile focus on box");
});

// Gets the position of touch from event
function getTouchCanvasPos(event) {
  let offsetLeft = canvas.getBoundingClientRect().left;
  let offsetTop = canvas.getBoundingClientRect().top;
  x = event.touches[0].pageX - offsetLeft;
  y = event.touches[0].pageY - offsetTop;
  return [x, y];
}

/*************************
 Drawing Helper Functions
*************************/

// Updates state pf globals to begin drawing
function activatePen() {
  activeTool.pressed = true;
  ctx.lineWidth = activeTool.tool.width;
  ctx.strokeStyle = activeTool.tool.color;
}

// Updates state pf globals to end drawing
function deactivatePen() {
  activeTool.pressed = false;
}


/*************************
 Toolkit Event Handlers
*************************/

// Click event handler for tool items
$(".toolkit-item.tool").on("click", function(e) {
  // Update active toolkit item
  $(".toolkit-item.tool").addClass("inactive");
  $(this).removeClass("inactive");

  // Perform action based on id of selected item
  let elementID = $(this).attr("id");

  switch (elementID) {
    case "black-pen":
      setToolToPen(penColors.BLACK);
      break;
    case "red-pen":
      setToolToPen(penColors.RED);
      break;
    case "blue-pen":
      setToolToPen(penColors.BLUE);
      break;
    case "eraser":
      setToolToEraser();
      break;
    default:
  }

});

// Click event handler for delete tool item
$(".delete").on("click", function(e) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function setToolToPen(color) {
  $(canvas).removeClass(activeTool.tool.cursor);

  activeTool.mode = toolModes.DRAW;
  activeTool.tool = pen;
  activeTool.tool.color = color;
  $(canvas).addClass(activeTool.tool.cursor);

  if (debug) console.log("Tool change to:", activeTool);
}

function setToolToEraser() {
  $(canvas).removeClass(activeTool.tool.cursor);

  activeTool.mode = toolModes.ERASE;
  activeTool.tool = eraser;
  $(canvas).addClass(activeTool.tool.cursor);

  if (debug) console.log("Tool change to:", activeTool);
}
