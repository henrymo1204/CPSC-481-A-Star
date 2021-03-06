//Class Number: CPSC 481-04
//Project Number and Name: Project 1, A* Search
//Team Name: IDK_Guys
//Team Members: Tommy Huynh, tommyh@csu.fullerton.edu
//Juheng Mo,henrymo@csu.fullerton.edu
//Calvin Nguyen,cnguyen808@csu.fullerton.edu
//Chi (Michael) Lam, micheallam@csu.fullerton.edu

//This file updates and draws the map and controls the bot's AI
//Computes all different paths and creates a step count for the final path

// cs-sketch.js; P5 key animation fcns.  // CF p5js.org/reference
// Time-stamp: <2020-09-20 22:55:31 Chuck Siska>

// ============================================================ Mods ====
// 2020-02-10 16:42:24: Add btns.
// 2020-02-09 16:55:21: Add btn onclick exported fn
// 2020-02-10 17:22:23: Log btn onclick
// 2020-03-11 13:15:36: Add list_fn (& maybe more)
// 2020-09-12 14:23:07: Add g_img_stuff usage
// 2020-09-12 16:14:03: Paint maze using file images: add g_img_stuff;
//  rip g_box; repl g_canvas w g_grid; repl g_cnv w g_p5_cnv
//  Add New Maze Drawing Code Section.

// Make global g_grid JS 'object': a key-value 'dictionary'.
var g_grid; // JS Global var, w grid size info; cvts grid cells to pixels
var g_frame_cnt; // Setup a P5 display-frame counter, to do anim
var g_frame_mod; // Update ever 'mod' frames.
var g_stop; // Go by default.
var g_p5_cnv;   // To hold a P5 canvas.
var g_button; // btn
var g_button2; // btn
var g_color;
var g_sctrl;
var g_tiles;
var grid;
var openSet = [];
var closeSet = [];
var start;
var end;
var path;

var g_l4job = { id: 1 }; // Put Lisp stuff f JS-to-access in ob; id to force ob.

// constructor for tile
function tile(i, j) {
    this.x = i;
    this.y = j;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.neighbors = [];// list of neighbors
    this.previous = null;// mother tile
    this.addNeightbors = function (grid) { // add neighbor to the list
        var i = this.x;
        var j = this.y;
        if (i + 1 < g_grid.wid && grid[j][i + 1] != null) {
            this.neighbors.push(grid[j][i + 1]);
        }
        if (i - 1 >= 0 && grid[j][i - 1] != null) {
            this.neighbors.push(grid[j][i - 1]);
        }
        if (j + 1 < g_grid.hgt && grid[j + 1][i] != null) {
            this.neighbors.push(grid[j + 1][i]);
        }
        if (j - 1 >= 0 && grid[j - 1][i] != null) {
            this.neighbors.push(grid[j - 1][i]);
        }
    }
}

// helper function to remove element from array
function removeFromArray(arr, ele) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i] == ele) {
            arr.splice(i, 1);
        }
    }
}

function heuristic(start, end) { // f(n) = g(n) + h(n) ... Manhattan (TaxiCab)
    // Calculates the amount fo distance from start to end
    //var d = dist(start.i, start.j, end.i, end.j);
    var d = (abs(start.x - end.x) + abs(start.y - end.y));
    return d;
}


function do_btn( )
{ // grab code from csu\assets\js\js+p5+editbox

    // Creates an <input></input> element in the DOM for text input.
    // Use g_input.size() to set the display length of the box.
    // g_input = createInput( ); // Create input textbox.
    // g_input.position(  20, 30 );
    // g_button = createButton( "Submit" );
    // g_button.id( "btn" ); //Add for P5 btn onclick
    // g_button.position( 160, 30 );
    //text( "Enter your name.", 20, 20 );

    g_button2 = createButton( "Save Image" );
    g_button2.position( 20, 60 );
    g_button2.mousePressed( save_image ); // the callback
}

function save_image( ) // btn
{
    save('myCanvas-' + g_frame_cnt +  '.jpg');
}

  //Also g_img_cell = loadImage( '10x10-sqr-RBY.png' );
let g_img_stuff;

function get_images( )
{
    g_img_stuff = new Image( );
    g_img_stuff.src = "sprite-cells-28x28-a.png";
}

function setup( ) // P5 Setup Fcn
{
    console.log( "p5 Beg P5 setup =====");
    console.log( "p5 @: log says hello from P5 setup()." );
    g_grid = { cell_size:28, wid:36, hgt:28 };
    g_frame_cnt = 0; // Setup a P5 display-frame counter, to do anim
    g_frame_mod = 40; // Update ever 'mod' frames.
    g_stop = 1; // Go by default.
    g_sctrl = 0;
    g_l4job = { id:1 };

    let sz = g_grid.cell_size;
    let width = sz * g_grid.wid;
    let height = sz * g_grid.hgt;
    grid = new Array(g_grid.hgt) // create an array
    for (var i = 0; i < grid.length; i++) { // create arrays inside the array
        grid[i] = new Array(g_grid.wid)
    }
    g_p5_cnv = createCanvas( width, height );  // Make a P5 canvas.
    console.log( "p5 @: createCanvas()." );
    draw_grid( sz, 50, 'white', 'yellow' );
    do_btn( ); //
    console.log( "p5 Load the image." );
    get_images( );
    console.log("p5 End P5 setup =====");
}

var g_bot = { dir:3, x:20, y:20, color:100 }; // Dir is 0..7 clock, w 0 up.


// ==================================================
// =================== New Maze Drawing Code ========
// ==================================================
function get_sprite_by_id( rsprite_id ) // get sprite sheet x,y offsets obj.
{ // ID is a 0-based index; sprites are assumed to be grid cell size.
    // Sprite sheet is 2-elts 1-row, wall=0 and floor=1.
    let id = rsprite_id % 4;
    let sprite_ob = { id: id, img: g_img_stuff };
    sprite_ob.sheet_pix_x = id * g_grid.cell_size;
    sprite_ob.sheet_pix_y = 0;
    return sprite_ob;
}

function grid_to_pix( rx, ry ) // Cvt grid cell x,y to canvas x,y wrapped.
{
    let pix_ob = { x: (rx % g_grid.wid) * g_grid.cell_size,
                   y: (ry % g_grid.hgt) * g_grid.cell_size };
    return pix_ob;
}

function draw_sprite_in_cell( rsprite_id, rx, ry ) // wraps in x,y ifn.
{
    console.log( "(p5 draw_sprite_in_cell ", rsprite_id, rx, ry, " )" );
    let sprite_ob = get_sprite_by_id( rsprite_id );
    let pix_ob = grid_to_pix( rx, ry );
    let ctx = g_p5_cnv.canvas.getContext('2d'); // get html toolbox to draw.
    ctx.drawImage( sprite_ob.img,
                   sprite_ob.sheet_pix_x, sprite_ob.sheet_pix_y,
                     g_grid.cell_size, g_grid.cell_size,
                   pix_ob.x, pix_ob.y,
                     g_grid.cell_size, g_grid.cell_size );
    console.log("end draw_sprite_in_cell)");
    grid[ry][rx] = new tile(rx, ry);
    console.log(grid[ry][rx])

    if (rx == 5 && ry == 27) { // find out all the neighbors for all the spots
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[0].length; j++) {
                if (grid[i][j] != null) {
                    grid[i][j].addNeightbors(grid);
                    console.log(grid[i][j]);
                }
            }
        }

        start = grid[0][1]; // set start
        end = grid[26][35]; // set end

        openSet.push(start);
    }
}

function draw_bot(rsprite_id, rx, ry) {
    console.log("(p5 draw_bot ", rsprite_id, rx, ry, " )");
    let sprite_ob = get_sprite_by_id(rsprite_id);
    let pix_ob = grid_to_pix(rx, ry);
    let ctx = g_p5_cnv.canvas.getContext('2d'); // get html toolbox to draw.
    ctx.drawImage(sprite_ob.img,
        sprite_ob.sheet_pix_x, sprite_ob.sheet_pix_y,
        g_grid.cell_size, g_grid.cell_size,
        pix_ob.x, pix_ob.y,
        g_grid.cell_size, g_grid.cell_size);
    console.log("end draw_bot)");
}

// ==================================================
// =================== END New Maze Drawing Code ========
// ==================================================

function draw_update()  // Update our display.
{
    //console.log( "p5 Call g_l4job.draw_fn" );
    g_l4job.draw_fn( );
}

function csjs_get_pixel_color_sum( rx, ry )
{
    let acolors = get( rx, ry ); // Get pixel color [RGBA] array.
    let sum = acolors[ 0 ] + acolors[ 1 ] + acolors[ 2 ]; // Sum RGB.
    //dbg console.log( "color_sum = " + sum );
    return sum;
}

function move_bot_to_mouse( )
{
    let x = mouseX;
    let y = mouseY;
    //console.log( "p5 move_bot: x,y = " + x + "," + y );
    let cz = g_grid.cell_size;
    let gridx = floor( x / cz );
    let gridy = floor( y / cz );
    //console.log( "p5 move_bot: gridx,y,cz = " + gridx + "," + gridy + ", " +cz );
    g_bot.x = gridx + g_grid.wid; // Ensure it's positive.
    g_bot.x %= g_grid.wid; // Wrap to fit box.
    g_bot.y = gridy + g_grid.hgt;
    g_bot.y %= g_grid.hgt;
}

function draw()  // P5 Frame Re-draw Fcn, Called for Every Frame.
{

    ++g_frame_cnt;
    if (!g_stop && (0 == g_frame_cnt % g_frame_mod))
    {
        //console.log( "p5 draw" );
        //move_bot_to_mouse( );
        //draw_update( );


        if (openSet.length > 0) {
            // keep going
            var lowestIndex = 0;
            for (var i = 0; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            var current = openSet[lowestIndex];
            console.log(current)

            for (var i = 0; i < openSet.length; i++) {
                draw_bot(0, openSet[i].x, openSet[i].y);
            }

            for (var i = 0; i < closeSet.length; i++) {
                draw_bot(3, closeSet[i].x, closeSet[i].y);
            }


            if (current == end) { // end the loop when reach the end
                noLoop();
            }

            removeFromArray(openSet, current);
            closeSet.push(current);

            // calculate the f, g, and h for all the neighbors
            var neighbors = current.neighbors;
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];

                if (!closeSet.includes(neighbor)){
                    // Counting the amount of g/steps
                    var tempSteps = current.g + 1;

                    if (openSet.includes(neighbor)) {
                        if (tempSteps < neighbor.g) {
                            neighbor.g = tempSteps;
                        }
                    }
                    else {
                        neighbor.g = tempSteps;
                        openSet.push(neighbor);
                    }

                    neighbor.h = heuristic(neighbor, end);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.previous = current;
                }
            }

            // draw the best path
            var stepCount = 0;
            console.log("DONE!");
            path = [];
            var temp = current;
            path.push(temp);
            while (temp.previous) {
                path.push(temp.previous);
                temp = temp.previous;
                stepCount++;
                draw_bot(2, temp.x, temp.y);
            }
            draw_bot(2, current.x, current.y);
            console.log("Step Count = " + stepCount);
        }
    }

    // OBE:
    // Use JS Canvas's draw fcn, instead of P5's image(), to avoid CORS error.
    // API: drawImage( image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight )
    //  s = source (the image), d = dest (the canvase)
    //
    //  console.log( "beg: sprite test" );
    //  let ctx = g_p5_cnv.canvas.getContext('2d');
    //  ctx.drawImage( g_img_stuff, 0, 0, 28, 28, 120, 40, 28, 28 );
    //  draw_sprite_in_cell( 0, 0, 0 );
    //  console.log( "end: sprite test" );
    //
    // Works

}

function keyPressed( )
{
    if ('a' == key) g_sctrl = 0;
    if ('b' == key) g_sctrl = 1;
    if ('s' == key) g_stop = ! g_stop;
    if ('p' == key) {
        console.log( "p5 list_fn" );
        g_l4job.list_fn( );
    }
    if ('z' == key) {
        console.log( "p5 Call g_l4job.zzdefg_fn" );
        g_l4job.zzdefg_fn( );
    }

    console.log( "p5 keyPressed: "
                 // + ${key} + " " + ${keyCode}
                 + key + " " + keyCode
                 +  " g_sctrl = " + g_sctrl );

    console.log( "p5 keyPressed: post g_stop = " + g_stop );
    console.log( "p5 mouseIsPressed = " + mouseIsPressed );
    if (g_stop) { noLoop(); } else {loop();}
}
