import React, { useEffect } from "react";
import { Group, Rect, Transformer, Text } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";

type Props = {
  shapeProps: any;
  isSelected: any;
  onSelect: any;
  onChange: any;
  onRemove: any;
  color?: string;
  editable?: boolean;
};

const Rectangle: React.FC<Props> = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  onRemove,
  color = "#00AEEF",
  editable = true,
}) => {
  const shapeRef = React.useRef(null);
  const trRef = React.useRef(null);
  const groupRef = React.useRef(null);
  const [crossPosition, setCrossPosition] = React.useState({
    x: shapeProps.x + shapeProps.width + 20,
    y: shapeProps.y - 30,
  });

  useEffect(() => {
    setCrossPosition({
      x: shapeProps.x + shapeProps.width + 20,
      y: shapeProps.y - 30,
    });
  }, [shapeProps]);

  React.useEffect(() => {
    if (isSelected) {
      // @ts-ignore
      trRef.current.nodes([shapeRef.current]);
      // @ts-ignore
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleRemove = (e: KonvaEventObject<MouseEvent | Event>) => {
    e.evt.stopPropagation();
    onRemove();
  };

  const handleDragMove = () => {
    const rectNode = shapeRef.current as unknown as Konva.Rect;
    const x = rectNode.x();
    const y = rectNode.y();
    setCrossPosition({
      x: x + rectNode.width() + 20,
      y: y - 30,
    });
  };

  return (
    <>
      <Group ref={groupRef} draggable={false}>
        <Rect
          onClick={onSelect}
          onTap={onSelect}
          ref={shapeRef}
          {...shapeProps}
          draggable={editable}
          onDragMove={handleDragMove}
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          stroke={color}
          fill={`${color}20`}
          strokeWidth={1}
          cornerRadius={3}
          onTransformEnd={(e) => {
            // transformer is changing scale of the node
            // and NOT its width or height
            // but in the store we have only width and height
            // to match the data better we will reset scale on transform end
            const node = shapeRef.current as unknown as Konva.Rect;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // we will reset it back
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              // set minimal value
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(node.height() * scaleY),
            });
          }}
        />
        {isSelected && (
          <Text
            id="#cross"
            text="❌"
            fontSize={20}
            fill="white"
            align="center"
            verticalAlign="middle"
            offsetX={8}
            offsetY={-8}
            onMouseDown={handleRemove}
            draggable={false}
            fontStyle="bold"
            {...crossPosition}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default Rectangle;
