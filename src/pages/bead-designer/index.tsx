import { useState, useRef, useCallback, useEffect } from "react";
import { Card, Image, InputNumber, Switch, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import colors from "./colors.json";
import "./index.less";

const BEAD_PALETTE: string[] = [];
const hexToCode: Record<string, string> = {};
for (const group of Object.values(colors)) {
  for (const [code, hex] of Object.entries(group as Record<string, string>)) {
    BEAD_PALETTE.push(hex);
    hexToCode[hex] = code;
  }
}

/**
 * 将十六进制颜色转换为 RGB 数组
 * @param hex - 十六进制颜色值，如 "#FF0000"
 * @returns [R, G, B] 三元组，每个值范围 0-255
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const paletteRgb = BEAD_PALETTE.map(hexToRgb);

/**
 * 在预设调色板中查找与给定颜色最接近的色号
 * 使用 RGB 三维空间的欧几里得距离进行匹配
 * @param r - 红色分量 (0-255)
 * @param g - 绿色分量 (0-255)
 * @param b - 蓝色分量 (0-255)
 * @returns 调色板中最接近的十六进制颜色值
 */
const findNearestBead = (r: number, g: number, b: number): string => {
  let minDist = Infinity;
  let nearest = BEAD_PALETTE[0];
  for (let i = 0; i < paletteRgb.length; i++) {
    const [pr, pg, pb] = paletteRgb[i];
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) {
      minDist = dist;
      nearest = BEAD_PALETTE[i];
    }
  }
  return nearest;
};

const BeadDesignerPage: React.FC = () => {
  // 限制宽高在 1-200 范围内
  const clampSize = (w: number, h: number): [number, number] => {
    return [Math.max(1, Math.min(200, w)), Math.max(1, Math.min(200, h))];
  };

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [beadHeight, setBeadHeight] = useState(100);
  const [beadWidth, setBeadWidth] = useState(100);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [colorStats, setColorStats] = useState<
    Array<{ hex: string; count: number }>
  >([]);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ratio = originalSize ? originalSize.w / originalSize.h : 1;

  // 生成拼豆设计图
  const genDesign = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const inW = Math.round(beadWidth);
    const inH = Math.round(beadHeight);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = inW;
    tempCanvas.height = inH;
    const tCtx = tempCanvas.getContext("2d")!;
    tCtx.drawImage(img, 0, 0, inW, inH);
    const imageData = tCtx.getImageData(0, 0, inW, inH);
    const pixels = imageData.data;

    // 背景色检测：采样四角，取最相近的聚类中心
    let bgR = 255;
    let bgG = 255;
    let bgB = 255;
    if (removeBg) {
      const lastIdx = (inH * inW - 1) * 4;
      const corners: Array<[number, number, number]> = [
        [pixels[0], pixels[1], pixels[2]],
        [pixels[(inW - 1) * 4], pixels[(inW - 1) * 4 + 1], pixels[(inW - 1) * 4 + 2]],
        [pixels[(inH - 1) * inW * 4], pixels[(inH - 1) * inW * 4 + 1], pixels[(inH - 1) * inW * 4 + 2]],
        [pixels[lastIdx], pixels[lastIdx + 1], pixels[lastIdx + 2]],
      ];
      let maxSame = 0;
      for (const [cr, cg, cb] of corners) {
        let same = 0;
        for (const [or, og, ob] of corners) {
          if ((cr - or) ** 2 + (cg - og) ** 2 + (cb - ob) ** 2 < 100) {
            same++;
          }
        }
        if (same > maxSame) {
          maxSame = same;
          bgR = cr;
          bgG = cg;
          bgB = cb;
        }
      }
    }

    const bgThreshold = 2500;
    const beadColors: Array<Array<string | null>> = [];
    for (let y = 0; y < inH; y++) {
      const row: Array<string | null> = [];
      for (let x = 0; x < inW; x++) {
        const idx = (y * inW + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        if (
          removeBg &&
          (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2 < bgThreshold
        ) {
          row.push(null);
        } else {
          row.push(findNearestBead(r, g, b));
        }
      }
      beadColors.push(row);
    }

    const cellSize = Math.max(4, Math.min(14, Math.floor(600 / inW)));
    const cellGap = 1;
    const outW = inW * (cellSize + cellGap) - cellGap;
    const outH = inH * (cellSize + cellGap) - cellGap;

    const outCanvas = canvasRef.current;
    if (!outCanvas) return;
    outCanvas.width = outW;
    outCanvas.height = outH;
    const oCtx = outCanvas.getContext("2d")!;
    oCtx.fillStyle = "#e8e8e8";
    oCtx.fillRect(0, 0, outW, outH);

    for (let y = 0; y < inH; y++) {
      for (let x = 0; x < inW; x++) {
        const color = beadColors[y][x];
        if (!color) continue;
        oCtx.fillStyle = color;
        oCtx.fillRect(
          x * (cellSize + cellGap),
          y * (cellSize + cellGap),
          cellSize,
          cellSize,
        );
      }
    }

    setThumbnailUrl(outCanvas.toDataURL());

    const countMap: Record<string, number> = {};
    for (const row of beadColors) {
      for (const hex of row) {
        if (!hex) continue;
        countMap[hex] = (countMap[hex] || 0) + 1;
      }
    }
    const stats = Object.entries(countMap)
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
    setColorStats(stats);
  }, [beadWidth, beadHeight]);

  // 图片或尺寸变更时自动生成
  useEffect(() => {
    if (imageUrl && imgRef.current) {
      genDesign();
    }
  }, [imageUrl, beadWidth, beadHeight, originalSize, genDesign]);

  // 自定义上传逻辑，读取文件为 data URL
  const handleRequest: NonNullable<UploadProps["customRequest"]> = (options) => {
    const { file, onSuccess } = options;
    const originFile = file as unknown as File;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url);
      setThumbnailUrl(null);
      const img = new window.Image();
      img.onload = () => {
        imgRef.current = img;
        setOriginalSize({ w: img.naturalWidth, h: img.naturalHeight });
        const h = Math.round(100 / (img.naturalWidth / img.naturalHeight));
        const [cw, ch] = clampSize(100, h);
        setBeadWidth(cw);
        setBeadHeight(ch);
        onSuccess?.({});
      };
      img.src = url;
    };
    reader.readAsDataURL(originFile);
  };

  // 文件列表变更时同步状态
  const handleChange = (info: { fileList: UploadFile[] }) => {
    setFileList(info.fileList);
    if (info.fileList.length === 0) {
      setImageUrl(null);
      setThumbnailUrl(null);
      setOriginalSize(null);
      setColorStats([]);
      imgRef.current = null;
    }
  };

  // 宽度变更时同步高度
  const handleWidthChange = (v: number | null) => {
    const w = v ?? 1;
    const h = Math.round(w / ratio);
    const [cw, ch] = clampSize(w, h);
    setBeadWidth(cw);
    setBeadHeight(ch);
  };

  // 高度变更时同步宽度
  const handleHeightChange = (v: number | null) => {
    const h = v ?? 1;
    const w = Math.round(h * ratio);
    const [cw, ch] = clampSize(w, h);
    setBeadWidth(cw);
    setBeadHeight(ch);
  };

  return (
    <div className="bead_designer">
      <h2 className="title">拼豆设计图生成</h2>

      <div className="content">
        <div className="left_panel">
          <Card className="upload_card" title="上传图片">
            <Upload
              accept="image/*"
              listType="picture-card"
              maxCount={1}
              fileList={fileList}
              customRequest={handleRequest}
              onChange={handleChange}
            >
              {fileList.length === 0 && (
                <div>
                  <InboxOutlined />
                  <div className="upload_text">点击或拖拽上传</div>
                </div>
              )}
            </Upload>
          </Card>

          {imageUrl && (
            <Card className="param_card" size="small">
              <div className="param_row">
                <span className="param_label">宽度 (beads):</span>
                <InputNumber
                  className="param_input"
                  min={1}
                  max={200}
                  value={beadWidth}
                  onChange={handleWidthChange}
                  size="small"
                />
              </div>
              <div className="param_row">
                <span className="param_label">高度 (beads):</span>
                <InputNumber
                  className="param_input"
                  min={1}
                  max={200}
                  value={beadHeight}
                  onChange={handleHeightChange}
                  size="small"
                />
              </div>
              <div className="param_switch">
                <span>去除背景</span>
                <Switch
                  checked={removeBg}
                  onChange={setRemoveBg}
                  size="small"
                />
              </div>
              {originalSize && (
                <div className="size_info">
                  原图: {originalSize.w} x {originalSize.h} (比例{" "}
                  {ratio.toFixed(2)})
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="right_panel">
          <div className="design_area">
            <Card className="design_card" title="设计图">
              {imageUrl ? (
                <>
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  {thumbnailUrl ? (
                    <Image
                      className="bead_preview"
                      src={thumbnailUrl}
                      preview={{ mask: "点击预览" }}
                    />
                  ) : (
                    <div className="placeholder">点击生成按钮生成设计图</div>
                  )}
                </>
              ) : (
                <div className="placeholder">请先上传图片</div>
              )}
            </Card>
          </div>

          {colorStats.length > 0 && (
            <div className="stat_area">
              <Card className="stat_card" size="small" title="配色统计">
                <div className="stat_total">
                  {colorStats.reduce((s, c) => s + c.count, 0)} 颗豆 /{" "}
                  {colorStats.length} 色
                </div>
                <div className="color_list">
                  {colorStats.map(({ hex, count }) => (
                    <div className="color_item" key={hex}>
                      <span
                        className="color_swatch"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="color_hex">{hexToCode[hex]}</span>
                      <span className="color_count">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeadDesignerPage;
