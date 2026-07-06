const AestheticGifParser = (function () {

    function parseGif(arrayBuffer) {
        const data = new Uint8Array(arrayBuffer);
        let pos = 0;

        function readByte() { return data[pos++]; }
        function readU16() {
            const v = data[pos] | (data[pos + 1] << 8);
            pos += 2;
            return v;
        }
        function readBytes(n) {
            const out = data.subarray(pos, pos + n);
            pos += n;
            return out;
        }

        const sig = String.fromCharCode(data[0], data[1], data[2], data[3], data[4], data[5]);
        if (sig !== "GIF87a" && sig !== "GIF89a") {
            throw new Error("Not a valid GIF file (bad signature)");
        }
        pos = 6;

        const screenWidth = readU16();
        const screenHeight = readU16();
        const packed = readByte();
        const gctFlag = (packed & 0x80) !== 0;
        const gctSize = 2 << (packed & 0x07);
        const bgColorIndex = readByte();
        pos++;

        let globalColorTable = null;
        if (gctFlag) {
            globalColorTable = readColorTable(gctSize);
        }

        const frames = [];
        let transparentIndex = -1;
        let disposalMethod = 0;
        let delayTime = 100;
        let frameLeft = 0, frameTop = 0, frameWidth = 0, frameHeight = 0;

        let canvas = new Uint8ClampedArray(screenWidth * screenHeight * 4);
        let savedUnderRegion = null;
        let savedRegionRect = null;

        function readColorTable(size) {
            const table = new Uint8Array(size * 3);
            table.set(readBytes(size * 3));
            return table;
        }

        function readSubBlocks() {
            const chunks = [];
            let total = 0;
            while (true) {
                const len = readByte();
                if (len === 0) break;
                const chunk = readBytes(len);
                chunks.push(chunk);
                total += len;
            }
            const out = new Uint8Array(total);
            let offset = 0;
            for (const c of chunks) { out.set(c, offset); offset += c.length; }
            return out;
        }

        function skipSubBlocks() {
            while (true) {
                const len = readByte();
                if (len === 0) break;
                pos += len;
            }
        }

        function lzwDecode(minCodeSize, compressed) {
            const CLEAR = 1 << minCodeSize;
            const END = CLEAR + 1;
            let codeSize = minCodeSize + 1;
            let nextCode = END + 1;
            let dict = [];

            function resetDict() {
                dict = [];
                for (let i = 0; i < CLEAR; i++) dict[i] = [i];
                dict[CLEAR] = [];
                dict[END] = [];
                nextCode = END + 1;
                codeSize = minCodeSize + 1;
            }
            resetDict();

            const out = [];
            let bitBuf = 0, bitCount = 0, bytePos = 0;
            let prev = null;

            function nextBits() {
                while (bitCount < codeSize) {
                    if (bytePos >= compressed.length) return null;
                    bitBuf |= compressed[bytePos++] << bitCount;
                    bitCount += 8;
                }
                const code = bitBuf & ((1 << codeSize) - 1);
                bitBuf >>= codeSize;
                bitCount -= codeSize;
                return code;
            }

            while (true) {
                const code = nextBits();
                if (code === null || code === END) break;
                if (code === CLEAR) {
                    resetDict();
                    prev = null;
                    continue;
                }
                let entry;
                if (code < dict.length && dict[code] && dict[code].length) {
                    entry = dict[code];
                } else if (code === nextCode && prev) {
                    entry = prev.concat([prev[0]]);
                } else {
                    break;
                }
                for (let i = 0; i < entry.length; i++) out.push(entry[i]);

                if (prev) {
                    dict[nextCode] = prev.concat([entry[0]]);
                    nextCode++;
                    if (nextCode === (1 << codeSize) && codeSize < 12) codeSize++;
                }
                prev = entry;
            }
            return out;
        }

        function deinterlace(indices, width, height) {
            const result = new Uint8Array(width * height);
            const passes = [
                { start: 0, step: 8 }, { start: 4, step: 8 },
                { start: 2, step: 4 }, { start: 1, step: 2 }
            ];
            let srcRow = 0;
            for (const p of passes) {
                for (let row = p.start; row < height; row += p.step) {
                    result.set(indices.subarray(srcRow * width, srcRow * width + width), row * width);
                    srcRow++;
                }
            }
            return result;
        }

        while (pos < data.length) {
            const blockType = readByte();

            if (blockType === 0x21) {
                const label = readByte();
                if (label === 0xF9) {
                    const blockSize = readByte();
                    const flags = readByte();
                    disposalMethod = (flags >> 2) & 0x07;
                    const transparentFlag = flags & 0x01;
                    delayTime = readU16() * 10;
                    const transIdx = readByte();
                    transparentIndex = transparentFlag ? transIdx : -1;
                    if (blockSize > 4) pos += (blockSize - 4);
                    readByte();
                } else {
                    skipSubBlocks();
                }
            } else if (blockType === 0x2C) {
                frameLeft = readU16();
                frameTop = readU16();
                frameWidth = readU16();
                frameHeight = readU16();
                const imgPacked = readByte();
                const localGctFlag = (imgPacked & 0x80) !== 0;
                const interlaceFlag = (imgPacked & 0x40) !== 0;
                const localGctSize = 2 << (imgPacked & 0x07);

                let colorTable = globalColorTable;
                if (localGctFlag) {
                    colorTable = readColorTable(localGctSize);
                }

                const minCodeSize = readByte();
                const compressed = readSubBlocks();
                let indices = lzwDecode(minCodeSize, compressed);

                const expected = frameWidth * frameHeight;
                if (indices.length < expected) {
                    const padded = new Uint8Array(expected);
                    padded.set(indices);
                    indices = padded;
                }
                let indexArray = Uint8Array.from(indices.slice(0, expected));
                if (interlaceFlag) {
                    indexArray = deinterlace(indexArray, frameWidth, frameHeight);
                }

                if (disposalMethod === 3) {
                    savedRegionRect = { left: frameLeft, top: frameTop, width: frameWidth, height: frameHeight };
                    savedUnderRegion = new Uint8ClampedArray(frameWidth * frameHeight * 4);
                    for (let y = 0; y < frameHeight; y++) {
                        const srcOffset = ((frameTop + y) * screenWidth + frameLeft) * 4;
                        const dstOffset = y * frameWidth * 4;
                        savedUnderRegion.set(canvas.subarray(srcOffset, srcOffset + frameWidth * 4), dstOffset);
                    }
                }

                const table = colorTable || globalColorTable;
                for (let y = 0; y < frameHeight; y++) {
                    for (let x = 0; x < frameWidth; x++) {
                        const srcIdx = indexArray[y * frameWidth + x];
                        if (srcIdx === transparentIndex) continue;
                        const dstX = frameLeft + x, dstY = frameTop + y;
                        if (dstX < 0 || dstY < 0 || dstX >= screenWidth || dstY >= screenHeight) continue;
                        const dstOffset = (dstY * screenWidth + dstX) * 4;
                        const tableOffset = srcIdx * 3;
                        canvas[dstOffset] = table[tableOffset];
                        canvas[dstOffset + 1] = table[tableOffset + 1];
                        canvas[dstOffset + 2] = table[tableOffset + 2];
                        canvas[dstOffset + 3] = 255;
                    }
                }

                const frameImage = new Uint8ClampedArray(canvas);
                frames.push({
                    imageData: frameImage,
                    delay: delayTime > 0 ? delayTime : 100,
                    disposal: disposalMethod
                });

                if (disposalMethod === 2) {
                    for (let y = 0; y < frameHeight; y++) {
                        const rowOffset = ((frameTop + y) * screenWidth + frameLeft) * 4;
                        for (let x = 0; x < frameWidth; x++) {
                            canvas[rowOffset + x * 4 + 3] = 0;
                        }
                    }
                } else if (disposalMethod === 3 && savedUnderRegion && savedRegionRect) {
                    for (let y = 0; y < savedRegionRect.height; y++) {
                        const srcOffset = y * savedRegionRect.width * 4;
                        const dstOffset = ((savedRegionRect.top + y) * screenWidth + savedRegionRect.left) * 4;
                        canvas.set(savedUnderRegion.subarray(srcOffset, srcOffset + savedRegionRect.width * 4), dstOffset);
                    }
                }
                transparentIndex = -1;
                disposalMethod = 0;
            } else if (blockType === 0x3B) {
                break;
            } else {
                break;
            }
        }

        return { width: screenWidth, height: screenHeight, frames };
    }

    return { parseGif };
})();