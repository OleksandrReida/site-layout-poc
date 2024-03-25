import React, { useCallback, useMemo, useState } from "react";
import "./App.css";
import { Layer, Stage, Image } from "react-konva";
import styled from "styled-components";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { IconButton } from "@mui/material";
import { ZoomIn, ZoomOut } from "@mui/icons-material";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  padding: 24px 0;
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
  bottom: 10px;
  right: 10px;
  z-index: 1;
`;

const WIDTH = 1400;
const HEIGHT = 800;

function App() {
  const [image, setImage] = useState<null | HTMLImageElement>(null);
  const [scale, setScale] = useState(1);

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
    console.log(e);
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
    stage.scale({ x: newScale, y: newScale });
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

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <Wrapper>
        <div style={{ position: "relative" }}>
          <Background />
          <Stage
            width={WIDTH}
            height={HEIGHT}
            onWheel={handleWheel}
            scaleX={scale}
            scaleY={scale}
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
          </Stage>

          <ToolsWrapper>
            <IconButton onClick={handleZoomIn} color="primary">
              <ZoomIn />
            </IconButton>
            <IconButton onClick={handleZoomOut} color="primary">
              <ZoomOut />
            </IconButton>
          </ToolsWrapper>
        </div>
      </Wrapper>
    </div>
  );
}

export default App;
