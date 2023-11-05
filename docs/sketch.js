depth_slider = document.getElementById("depth");
min_split_slider = document.getElementById("split_");
jitter_slider = document.getElementById("jitter");

class point {
    constructor(x,y, idx=0) {
        this.classes = ["A", "B"];
        this.idx = idx;
        this.value = this.classes[this.idx];
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }

    show() {
        // fill(255);
        if (this.value == "A") {
            fill(255, 0, 0);
        }
        else {
            fill(0, 255, 0);
        }
        ellipse(this.x, this.y, 25, 25);
        fill(0);
        text(this.value, this.x-3, this.y+3);
    }

    change() {
        this.idx = (this.idx + 1) % 2;
        this.value = this.classes[this.idx];
    }

    jitter(vmax) {
        this.vx += random(-1, 1);
        this.vy += random(-1, 1);
        //  normalize
        let v = sqrt(this.vx**2 + this.vy**2);
        if (v > vmax) {
            this.vx *= vmax/v;
            this.vy *= vmax/v;
        }
        //  apply 
        this.x += this.vx;
        this.y += this.vy;
        // wrap around
        this.x = (this.x+width)%width;
        this.y = (this.y+height)%height;

    }

}

class DecisionTree{
    constructor(min_split=2, max_depth=10) {
        this.root = null;
        this.min_split = min_split;
        this.max_depth = max_depth;
    }

    fit(points) {
        this.root = this.growTree(points);
    }

    accuracy(points) {
        let correct = 0;
        points.forEach(point => {
          correct += this.predict(point) === point.idx ? 1 : 0;
        });
        return correct / points.length;
    }

    predict(point) {
        let node = this.root;
        while (!node.isLeaf()) {
          if (node.feature === "x") {
            node = point.x < node.threshold ? node.left : node.right;
          } else {
            node = point.y < node.threshold ? node.left : node.right;
          }
        }
        return node.value;
      }

    growTree(points, depth = 0) {
        // check stopping criteria
        if (points.length === 0 || depth >= this.max_depth || points.length < this.min_split) {
            // If there are no points left or other stopping criteria are met, return a leaf node
            const val = this.majorityClass(points);
            return new Node(null, null, null, null, val);
        }
    
        // find best split
        let best_feature_and_threshold = this.bestSplit(points);
    
        // If no valid split was found, return a leaf node
        if (best_feature_and_threshold === null) {
            const val = this.majorityClass(points)
            return new Node(null, null, null, null, val);
        }
    
        let [best_feature, best_threshold] = best_feature_and_threshold;
    
        // create children
        let [left, right] = this.split(points, best_feature, best_threshold);
    
        // if no valid split could be made, create a leaf node
        if (left.length === 0 || right.length === 0) {
            const val = this.majorityClass(points);
            return new Node(null, null, null, null, val);
        }
    
        let left_node = this.growTree(left, depth + 1);
        let right_node = this.growTree(right, depth + 1);
        return new Node(best_feature, best_threshold, left_node, right_node, null);
    }

    majorityClass(points) {
        let counts = this.countClasses(points);
        // Assuming classes are 0 and 1, determine which class is the majority
        let majorityIdx = counts[0] > counts[1] ? 0 : 1;
        // Return the class value, not the index
        return majorityIdx;
    }

    bestSplit(points) {
        let best_gain = -1;
        let best_feature = null;
        let best_threshold = null;
        for (let i = 0; i < points.length; i++) {
            for (let j = 0; j < points.length; j++) {
                let feature = "x";
                let threshold = points[i].x;
                let gain = this.giniGain(points, feature, threshold);
                if (gain > best_gain) {
                    best_gain = gain;
                    best_feature = feature;
                    best_threshold = threshold;
                }

                feature = "y";
                threshold = points[i].y;
                gain = this.giniGain(points, feature, threshold);
                if (gain > best_gain) {
                    best_gain = gain;
                    best_feature = feature;
                    best_threshold = threshold;
                }
            }
        }
        return [best_feature, best_threshold];
    }

    giniGain(points, feature, threshold) {
        /* ginigain = gini(parent) - p * gini(left) - (1-p) * gini(right) */
        let [left, right] = this.split(points, feature, threshold);
        let p = left.length / points.length;
        return this.gini(points) - p * this.gini(left) - (1-p) * this.gini(right);
    }

    gini(points) {
        let counts = this.countClasses(points);
        let impurity = 1;
        for (let i = 0; i < counts.length; i++) {
            let prob_of_i = counts[i] / points.length;
            impurity -= prob_of_i ** 2;
        }
        return impurity;
    }

    countClasses(points) {
        let counts = [0, 0];
        for (let i = 0; i < points.length; i++) {
            counts[points[i].idx] += 1;
        }
        return counts;
    }

    split(points, feature, threshold) {
        let left = [];
        let right = [];
        for (let i = 0; i < points.length; i++) {
            if (feature=="x") {
                if (points[i].x < threshold) {
                    left.push(points[i]);
                }else {
                    right.push(points[i]);
                }
            }
            else {
                if (points[i].y < threshold) {
                    left.push(points[i]);
                }else {
                    right.push(points[i]);
                }
            }
        }
        return [left, right];
    }
    show() {
        if (this.root != null) {
            // Start with the whole canvas as the bounding box
            this.root.show(0, 0, width, height);
        } else {
            console.log("No root");
        }
    }
}

class Node{
    constructor(feature, threshold, left = null, right = null, value = null) {
        this.feature = feature;
        this.threshold = threshold;
        this.value = value;
        this.left = left;
        this.right = right;
      }
    
    isLeaf() {
    return this.left == null && this.right == null;
    }

    show(minX, minY, maxX, maxY) {
        if (this.isLeaf()) {
            // Color the area based on the node's class
            noStroke();
            fill(this.value === 0 ? [255, 200, 200] : [200, 255, 200]);
            rect(minX, minY, maxX - minX, maxY - minY);
        } else {
            // Recursive case: split the area and show children
            if (this.feature == "x") {
                // Vertical split
                this.left.show(minX, minY, this.threshold, maxY);
                this.right.show(this.threshold, minY, maxX, maxY);
                stroke(0);
                line(this.threshold, minY, this.threshold, maxY);
            } else {
                // Horizontal split
                this.left.show(minX, minY, maxX, this.threshold);
                this.right.show(minX, this.threshold, maxX, maxY);
                stroke(0);
                line(minX, this.threshold, maxX, this.threshold);
            }
        }
    }
}
let points = [];
let dTree = new DecisionTree(2,3);
let jitter=0;

//  attach the sldiers to the tree
depth_slider.oninput = function() {
    dTree.max_depth = depth_slider.value;
}
min_split_slider.oninput = function() {
    dTree.min_split = min_split_slider.value;
}
jitter_slider.oninput = function() {
    jitter = jitter_slider.value;
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }
    found = false;
    for (let i = 0; i < points.length; i++) {
        if (dist(mouseX, mouseY, points[i].x, points[i].y) < 12.5) {
            if (mouseButton == LEFT) {
                points[i].change();
                found = true;
            }else if (mouseButton == RIGHT) {
                points.splice(i, 1);
                found = true;
            }
        }
    }
    if (!found) {
        points.push(new point(mouseX, mouseY));
    }
    // dTree.fit(points);
    // console.log("accuracy is: ", dTree.accuracy(points)*100, "%");
}

function setup() {
    // add check button for jitter
    createCanvas(500, 500);
    //  centroid A
    let x = randomGaussian(100, 50);
    let y = randomGaussian(100, 50);
    for (let i = 0; i < 10; i++) {
        let temp_x = randomGaussian(x, 50);
        temp_x = temp_x>0?temp_x:0;
        temp_x = temp_x<width?temp_x:width;
        
        let temp_y = randomGaussian(y, 50);
        temp_y = temp_y>0?temp_y:0;
        temp_y = temp_y<height?temp_y:height;
        points.push(new point(temp_x, temp_y, 0));

    }
    // centroid B
    x = randomGaussian(300, 50);
    y = randomGaussian(300, 50);
    for (let i = 0; i < 10; i++) {
        let temp_x = randomGaussian(x, 50);
        temp_x = temp_x>0?temp_x:0;
        temp_x = temp_x<width?temp_x:width;
        
        let temp_y = randomGaussian(y, 50);
        temp_y = temp_y>0?temp_y:0;
        temp_y = temp_y<height?temp_y:height;
        points.push(new point(temp_x, temp_y, 1));
    }
    dTree.fit(points);
}

function draw() {
    // background(220);
    dTree.fit(points);
    const acc = dTree.accuracy(points);
    document.getElementById("accuracy").innerHTML = `Accuracy: ${(acc*100).toFixed(2)}%`;
    dTree.show();
    for (let i = 0; i < points.length; i++) {
        points[i].show();
        points[i].jitter(jitter);
    }
}