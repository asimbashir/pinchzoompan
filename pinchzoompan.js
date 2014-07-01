//**********************************************************
//Desc: Handles controller logic for the pinch zoom panning
//**********************************************************


var pinchZoomPan = angular.module('pinchZoomPan', ['hmTouchEvents']);

pinchZoomPan.controller('pinchZoomPanController',
    function ($scope, $location, $timeout) {
        var minWidth, minHeight, maxWidth = 4900, maxHeight = 4337, maxZoom = 4;
        var minZoomX = .25;
        var minZoomY = .25;

        var zooming = false;
        var startX0;
        var startY0;
        var startX1;
        var startY1;
        var endX0;
        var endY0;
        var endX1;
        var endY1;
        var deltaX = 0, deltaY = 0;
        var startDistanceBetweenFingers;
        var endDistanceBetweenFingers;
        var pinchRatio;
        var imgWidth;
        var imgHeight;

        var currentContinuousZoomX = minZoomX, currentContinuousZoomY = minZoomY;
        var currentOffsetX = 0;
        var currentOffsetY = 0;
        var currentWidth;
        var currentHeight;

        var newContinuousZoomX = minZoomX, newContinuousZoomY = minZoomY;
        var newWidth;
        var newHeight;
        var newOffsetX = 0;
        var newOffsetY = 0;

        var centerPointStartX;
        var centerPointStartY;
        var centerPointEndX;
        var centerPointEndY;
        var translateFromZoomingX;
        var translateFromZoomingY;
        var translateFromTranslatingX;
        var translateFromTranslatingY;
        var translateTotalX;
        var translateTotalY;

        var percentageOfImageAtPinchPointX;
        var percentageOfImageAtPinchPointY;

        var map;
        var mapOffset;
        var svg2winRatioX = 1, svg2winRatioY = 1, windowX, windowY;
        var baseRatio, baseRatioX, baseRatioY;

        var container, markers = [], markerPoints = [], markerGroup, resetAllMarkers = false;
        pinWidth = 56, pinHeight = 48;
        var currentLocationX = 2156, currentLocationY = 1977;

        init();

        function init() {
            map = $("#pinchzoompan");
            imgWidth = maxWidth = (parseFloat(map.attr("width"))) ? parseFloat(map.attr("width")) : maxWidth;
            imgHeight = maxHeight = (parseFloat(map.attr("height"))) ? parseFloat(map.attr("height")) : maxHeight;
            console.log(imgWidth);
            console.log(imgHeight);
            newWidth = currentWidth = minWidth = maxWidth * minZoomX;
            newHeight = currentHeight = minHeight = maxHeight * minZoomY;
            mapOffset = map.offset();
            container = $("#wrapper");
            windowX = minWidth; container.width();
            windowY = minHeight; container.height();
        }

        $scope.svgHandler = function($event){
          if($event.type == 'transformstart'){
            touchStart($event.gesture);
          } else if($event.type == 'transform'){
            touchMove($event.gesture);
          } else if($event.type == 'transformend'){
            touchEnd($event.gesture);
          }  else if($event.type == 'dragstart'){
            dragStart($event.gesture);
          } else if($event.type == 'drag'){
            dragMove($event.gesture);
          } else if($event.type == 'dragend'){
            dragEnd($event.gesture);
          }
          $event.preventDefault();
        }

        function touchStart(event)
        {
            if (event.touches.length == 2) {
                zooming = true;
                currentOffsetX = newOffsetX;
                currentOffsetY = newOffsetY;
                currentWidth = newWidth;
                currentHeight = newHeight;
                currentContinuousZoomX = newContinuousZoomX;
                currentContinuousZoomY = newContinuousZoomY;

                startX0 = event.touches[1].pageX - mapOffset.left;
                startY0 = event.touches[1].pageY - mapOffset.top;
                startX1 = event.touches[0].pageX - mapOffset.left;
                startY1 = event.touches[0].pageY - mapOffset.top;
                centerPointStartX = ((startX0 + startX1) / 2.0);
                centerPointStartY = ((startY0 + startY1) / 2.0);
                percentageOfImageAtPinchPointX = (centerPointStartX - currentOffsetX)/currentWidth;
                percentageOfImageAtPinchPointY = (centerPointStartY - currentOffsetY)/currentHeight;
                startDistanceBetweenFingers = Math.sqrt( Math.pow((startX1-startX0),2) + Math.pow((startY1-startY0),2) );
                resetAllMarkers = true;
            }
        }

        function touchMove(event)
        {
            if (zooming && event.touches.length == 2) {     
                // Get the new touches
                endX0 = event.touches[1].pageX - mapOffset.left;
                endY0 = event.touches[1].pageY - mapOffset.top;
                endX1 = event.touches[0].pageX - mapOffset.left;
                endY1 = event.touches[0].pageY - mapOffset.top;

                // Calculate current distance between points to get new-to-old pinch ratio and calc width and height
                endDistanceBetweenFingers = Math.sqrt( Math.pow((endX1-endX0),2) + Math.pow((endY1-endY0),2) );
                pinchRatio = endDistanceBetweenFingers/startDistanceBetweenFingers;
                newContinuousZoomX = getValidZoomX(pinchRatio * currentContinuousZoomX);
                newContinuousZoomY = getValidZoomY(pinchRatio * currentContinuousZoomY);
                newWidth = imgWidth * newContinuousZoomX;
                newHeight  = imgHeight * newContinuousZoomY;
                
                // Get the point between the two touches, relative to upper-left corner of image
                centerPointEndX = ((endX0 + endX1) / 2.0);
                centerPointEndY = ((endY0 + endY1) / 2.0);
                
                // This is the translation due to pinch-zooming
                translateFromZoomingX = ((currentWidth - newWidth) * percentageOfImageAtPinchPointX);
                translateFromZoomingY = ((currentHeight - newHeight) * percentageOfImageAtPinchPointY);
                
                // And this is the translation due to translation of the centerpoint between the two fingers
                translateFromTranslatingX = centerPointEndX - centerPointStartX;
                translateFromTranslatingY = centerPointEndY - centerPointStartY;
                
                // Total translation is from two components: (1) changing height and width from zooming and (2) from the two fingers translating in unity
                translateTotalX = translateFromZoomingX + translateFromTranslatingX;
                translateTotalY = translateFromZoomingY + translateFromTranslatingY;
                
                // the new offset is the old/current one plus the total translation component
                newOffsetX = getValidOffsetX(currentOffsetX + translateTotalX);
                newOffsetY = getValidOffsetY(currentOffsetY + translateTotalY);
            }
        }

        function touchEnd(event)
        {
            if (zooming) {
                zooming = false;
                currentOffsetX = newOffsetX;
                currentOffsetY = newOffsetY;
                currentWidth = newWidth;
                currentHeight = newHeight;
                currentContinuousZoomX = newContinuousZoomX;
                currentContinuousZoomY = newContinuousZoomY;
                resetAllMarkers = false;
            }
        }

        function dragStart(event)
        {
            startX0 = event.center.pageX;
            startY0 = event.center.pageY;
        }

        function dragMove(event)
        {
            endX0 = event.center.pageX;
            endY0 = event.center.pageY;

            deltaX = endX0 - startX0;
            var newLeft = newOffsetX + (deltaX);
            newOffsetX = newLeft;

            deltaY = endY0 - startY0;
            var newTop = newOffsetY + (deltaY);
            newOffsetY = newTop;
            console.log(newOffsetX + ":" + newOffsetY)
            startX0 = endX0;
            startY0 = endY0;
        }

        function dragEnd(event){}

        var getValidZoomX = function(currentZoomX){
            if(currentZoomX > maxZoom){
                return maxZoom;
            } else if( currentZoomX < minZoomX){
                return minZoomX;
            }
            return currentZoomX;
        }

        var getValidZoomY = function(currentZoomY){
            if(currentZoomY > maxZoom){
                return maxZoom;
            } else if( currentZoomY < minZoomY){
                return minZoomY;
            }
            return currentZoomY;
        }

        var timeoutFunc = function(){
            if(map){
                var transform = "translate3d(" + newOffsetX + "px," + newOffsetY + "px, 0) " + "scale3d(" + newContinuousZoomX + "," + newContinuousZoomY + ", 1) ";
                map.css({"-webkit-transform": transform, "msTransform": transform});
            }
            $timeout(timeoutFunc, 1000/60);
        };

        $timeout(timeoutFunc, 1000/60);

    });