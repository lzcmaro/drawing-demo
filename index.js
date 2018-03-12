jQuery(function($) {

  var $canvas = $('#canvas');

  $canvas.drawImage({
    layer: true,
    source: './snip.png',
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    fromCenter: false
  });

  $('#btn').bind('click', function() {
    var layers = $canvas.getLayerGroup('mark'), rects;
    if (layers) {
      rects = $.map(layers, function(layer) {
        return getRectData(layer)
      });

      alert(JSON.stringify(rects));

      console.log(rects);
    }
  });

  bindDrawEvents();
  bindIconEvents();

});

function bindDrawEvents() {
  var $canvas = $('#canvas'), 
    canvas = $canvas.get(0),
    $icon = $('#icon-close'),
    canvasRect = canvas.getBoundingClientRect(),
    canvasLeft = canvasRect.left,
    canvasTop = canvasRect.top,
    mousedown = false,
    layerName, 
    layerIndex = 0, 
    x = 0,
    y = 0,
    width, 
    height;

  $canvas.bind('mousedown', onMousedown)
    .bind('mouseup', onMouseup)
    .bind('mousemove', onMousemove);

  function onMousedown(e) {
    // console.log('mousedown');
    mousedown = true;
    layerIndex++;
    layerName = 'layer' + layerIndex;
    x = e.clientX - canvasLeft;
    y = e.clientY - canvasTop;
    
    $canvas.addLayer(getLayerProperties(layerName, x, y, 1, 1))
      .drawLayers();

    $canvas.bind('mousemove.layer', function(e) {
      width = e.clientX - canvasLeft - x;
      height = e.clientY - canvasTop - y;
      
      $canvas.removeLayer(layerName)
      .addLayer(getLayerProperties(layerName, x, y, width, height))
      .drawLayers()
    });
  }

  function onMouseup(e) {
    // console.log('mouseup');
    $canvas.unbind('mousemove.layer');
    mousedown = false;
    width = e.clientX - canvasLeft - x;
    height = e.clientY - canvasTop - y;

    $canvas.removeLayer(layerName);

    // 避免创建多余的图层，比如在点击的时候
    if (width !== 0 && height !== 0) {
      $canvas.addLayer(getLayerProperties(layerName, x, y, width, height))
        .drawLayers()
        .saveCanvas();
    }
  }

  function onMousemove(e) {
    var layers, layer, point, len, i;

    // 在鼠标按下，并且未松开时，直接return，避免这时显示删除图标
    if (mousedown) {
      return false;
    }

    layers = $canvas.getLayerGroup('mark')
    point = getMousePos(canvas, e);

    if (layers) {
      // 优先处理最上层图层
      for (i = layers.length - 1; i >= 0; i--) {
        layer = layers[i];
        // 判断当前坐标是否在图层区域内
        if (isPointInRect(canvas, layer, point)) {
          // inBounds=false时，标识当前进入了新的图层区域
          // 如果inBounds=true，标识当前鼠标还在当前图层区域中移动，不作处理
          if (!layer.inBounds) {
            // 设置所有图层的inBounds属性为false，以便它能在下次遍历时能正常访问到
            $canvas.setLayers({
              inBounds: false
            });
            // 设置当前图层的inBounds为true，方便后续处理
            $canvas.setLayer(layer.name, {
              inBounds: true
            });
            // 显示图标并把layer缓存到$icon中，便于后续在点击图标时能找到对应的图层数据
            showIcon($icon, layer).data('layer', layer);
          }
          
          // 这里直接return，不再处理其它图层
          return false;
        }      
      }
    }
  }

}

function bindIconEvents() {
  $('#icon-close').bind('click', function() {
    var layer = $(this).data('layer');
    if (layer) {
      $('#canvas').removeLayer(layer.name)
        .drawLayers()
        .saveCanvas();
    }

    $(this).hide();
  })
}

function showIcon($icon, layer) {
  return $icon.css({
    // 在反方向拖拽鼠标画图时，其width, height为负值
    // 这里需要处理，使得图标能正确在左上角显示
    left: layer.x + Math.max(0, layer.width) - 10,
    top: layer.y + Math.min(0, layer.height) - 10
  })
  .show();
}

function getLayerProperties(layerName, x, y, width, height) {
  return {
    name: layerName,
    groups: ['mark'],
    type: 'rectangle',
    strokeStyle: 'red',
    strokeWidth: 2,
    fromCenter: false,
    x: x,
    y: y,
    width: width,
    height: height
  }
}

function isPointInRect(canvas, rect, point) {
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.closePath();
  return ctx.isPointInPath(point.x, point.y)
}

function getMousePos(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function getRectData(layer) {
  return {
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height
  }
}
