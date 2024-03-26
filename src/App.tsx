import React, { useCallback, useMemo, useRef, useState } from "react";
import "./App.css";
import { Layer, Stage, Image } from "react-konva";
import styled from "styled-components";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  AddAlert,
  CloudUpload,
  CropSquare,
  ImportExport,
  IosShare,
  SaveAs,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import { Rectangle as RectangeType } from "./types";
import Rectangle from "./Rectange";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: #f0f0f0;
`;

const ToolsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 1;
`;

const RightToolsWrapper = styled(ToolsWrapper)`
  bottom: 10px;
  right: 10px;
`;

const LeftToolsWrapper = styled(ToolsWrapper)`
  top: 10px;
  left: 10px;
`;

const RightTopToolsWrapper = styled(ToolsWrapper)`
  top: 10px;
  right: 10px;
`;

const importJsonFromFile = (file: any) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        // @ts-ignore
        const jsonData = JSON.parse(event.target.result);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file);
  });
};

const WIDTH = 1400;
const HEIGHT = 800;

function App() {
  const [editMode, setEditMode] = useState(true);

  const [highlighted, setHighlighted] = useState<string | null>(null);

  const stageRef = useRef(null);

  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const [image, setImage] = useState<null | HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({
    x: 0,
    y: 0,
  });
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  const handleImageUpload = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        setImage(img);
      };
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.currentTarget as Konva.Stage;
    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer!.x - stage.x()) / oldScale,
      y: (pointer!.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
    setScale(newScale);

    const newPos = {
      x: pointer!.x - mousePointTo.x * newScale,
      y: pointer!.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  }, []);

  const handleZoomIn = () => {
    setScale(scale * 1.1);
  };

  const handleZoomOut = () => {
    setScale(scale / 1.1);
  };

  const backgroundScale = useMemo(
    () => (image ? Math.min(WIDTH / image.width, HEIGHT / image.height) : 1),
    [image],
  );

  const imageWidth = image ? image.width * backgroundScale : 0;
  const imageHeight = image ? image.height * backgroundScale : 0;

  const exportToPNG = () => {
    const stage = stageRef.current as unknown as Konva.Stage;

    if (stage) {
      const originalScale = { x: stage.scaleX(), y: stage.scaleY() };
      const originalPosition = { x: stage.x(), y: stage.y() };

      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      stage.batchDraw();

      const dataURL = stage.toDataURL({
        mimeType: "image/png",
        quality: 1,
        pixelRatio: window.devicePixelRatio,
      });

      stage.scale(originalScale);
      stage.position(originalPosition);
      stage.batchDraw();

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "stage.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!dragging) return;

    const stage = e.target.getStage()!;
    const pointerPosition = stage.getPointerPosition()!;
    const dx = pointerPosition.x - lastPointerPosition.x;
    const dy = pointerPosition.y - lastPointerPosition.y;

    setStagePosition({
      x: stagePosition.x + dx,
      y: stagePosition.y + dy,
    });
    setLastPointerPosition(pointerPosition);
    stage.position(stagePosition);
    stage.batchDraw();
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const [rectangles, setRectangles] = useState<RectangeType[]>([]);
  const [selectedId, selectShape] = React.useState<null | string>(null);

  const checkDeselect = (e: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked on empty area
    const attributes = e.target.attrs;
    const clickedOnEmpty =
      attributes.id !== selectedId && !attributes.name?.includes("anchor");
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (
      e.target &&
      (!(e.target instanceof Konva.Shape) || e.target instanceof Konva.Image)
    ) {
      setDragging(true);
      setLastPointerPosition(e.target.getStage()!.getPointerPosition()!);
    }

    checkDeselect(e);
  };

  const handleAddRectangle = () => {
    const stage = stageRef.current as unknown as Konva.Stage;
    const newRectangle: RectangeType = {
      x: stage.width() / 2 - 50,
      y: stage.height() / 2 - 50,
      width: 100,
      height: 100,
      id: `rect${rectangles.length + 1}`,
    };
    setRectangles([...rectangles, newRectangle]);
  };

  const exportToJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(rectangles)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "test.json";
    a.click();

    URL.revokeObjectURL(url);
  }, [rectangles]);

  const handleFileChange = async (event: any) => {
    const file = event.target.files[0];
    try {
      const jsonData = await importJsonFromFile(file);
      // @ts-ignore
      setRectangles(jsonData);
    } catch (error) {
      console.error("Error importing JSON:", error);
    }
  };

  const addAlert = () => {
    setRectangles(
      rectangles.map((rect, index) => {
        if (index % 2 !== 0) {
          return { ...rect, alert: true };
        }
        return rect;
      }),
    );
  };

  return (
    <Wrapper>
      <div style={{ position: "relative" }}>
        <Background />
        <Stage
          width={WIDTH}
          height={HEIGHT}
          onWheel={handleWheel}
          ref={stageRef}
          scaleY={scale}
          scaleX={scale}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {image && (
              <Image
                image={image}
                x={(WIDTH - imageWidth) / 2}
                y={(HEIGHT - imageHeight) / 2}
                width={imageWidth}
                height={imageHeight}
              />
            )}
          </Layer>
          <Layer>
            {rectangles.map((rect, i) => {
              return (
                <Rectangle
                  key={i}
                  shapeProps={rect}
                  isSelected={rect.id === selectedId}
                  onSelect={() => {
                    if (editMode) {
                      selectShape(rect.id);
                    }
                  }}
                  // @ts-ignore
                  onChange={(newAttrs) => {
                    const rects = rectangles.slice();
                    rects[i] = newAttrs;
                    setRectangles(rects);
                  }}
                  onRemove={() => {
                    const rects = rectangles.filter(
                      (item) => item.id !== rect.id,
                    );

                    setRectangles(rects);
                  }}
                  color={
                    highlighted === rect.id
                      ? "#008000"
                      : rect.alert
                        ? "#FF0000"
                        : undefined
                  }
                  editable={editMode}
                />
              );
            })}
          </Layer>
        </Stage>

        <LeftToolsWrapper>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
            ref={fileInputRef}
          />
          <IconButton
            color="primary"
            //@ts-ignore
            onClick={() => fileInputRef.current.click()}
          >
            <CloudUpload />
          </IconButton>
          <IconButton onClick={handleAddRectangle} color="primary">
            <CropSquare />
          </IconButton>
        </LeftToolsWrapper>

        <RightToolsWrapper>
          <IconButton onClick={exportToJson} color="primary">
            <IosShare />
          </IconButton>
          <input
            type="file"
            accept=".json"
            onInput={handleFileChange}
            style={{ display: "none" }}
            ref={jsonInputRef}
          />
          <IconButton
            color="primary"
            //@ts-ignore
            onClick={() => jsonInputRef.current.click()}
          >
            <ImportExport />
          </IconButton>
          <IconButton onClick={exportToPNG} color="primary">
            <SaveAs />
          </IconButton>
          <IconButton onClick={handleZoomIn} color="primary">
            <ZoomIn />
          </IconButton>
          <IconButton onClick={handleZoomOut} color="primary">
            <ZoomOut />
          </IconButton>
        </RightToolsWrapper>

        <RightTopToolsWrapper>
          <IconButton onClick={addAlert} color="primary">
            <AddAlert />
          </IconButton>
          <Button color="primary" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Disable" : "Enable"} edit
          </Button>
        </RightTopToolsWrapper>
      </div>
      <List>
        {rectangles.map((rectangle) => (
          <ListItem
            key={rectangle.id}
            onClick={() => setHighlighted(rectangle.id)}
          >
            <ListItemText
              primary={`ID: ${rectangle.id}`}
              secondary={`Position: (${rectangle.x}, ${rectangle.y}), Size: ${rectangle.width}x${rectangle.height}`}
              primaryTypographyProps={{
                color: rectangle.alert ? "error" : "initial",
              }}
            />
          </ListItem>
        ))}
      </List>
    </Wrapper>
  );
}

export default App;
