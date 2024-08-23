import React, { useState, useEffect } from "react";
import { FaCheck } from 'react-icons/fa';
import { FaClock } from 'react-icons/fa';

function MainComponent({ sheetWidth, sheetHeight, minProdazha, weight1, sale_Ton, sale_service, imageSrc, naimenovanie, data }) {
  const [partCount, setPartCount] = React.useState(0);
  const [requestedPartCount, setRequestedPartCount] = React.useState(0);
  const [utilizationPercent, setUtilizationPercent] = React.useState(0);
  const [sheets, setSheets] = React.useState([[]]);
  const [currentSheet, setCurrentSheet] = React.useState(0);
  const [draggedPart, setDraggedPart] = React.useState(null);
  const [error, setError] = React.useState("");
  const [remainingPercentage, setRemainingPercentage] = React.useState(0);
  const [originalPositions, setOriginalPositions] = React.useState({});
  const [repeatedSheetsCount, setRepeatedSheetsCount] = React.useState(0);
  const [showNewPartForm, setShowNewPartForm] = React.useState(false);
  const [newPartWidth, setNewPartWidth] = React.useState("");
  const [newPartHeight, setNewPartHeight] = React.useState("");
  const [newPartCount, setNewPartCount] = React.useState("");
  const [usagePercentage, setUsagePercentage] = React.useState(0);
const [repeatingSheetsCount, setRepeatingSheetsCount] = React.useState(0);
const [newPartCountInput, setNewPartCountInput] = React.useState(null); // Локальное состояние для поля ввода
const [parts, setParts] = React.useState([]);



  //const sheetWidth = 6000; // мм
  //const sheetHeight = 1500; // мм
  const partWidth = 500; // мм
  const partHeight = 500; // мм
  const gridSize = 100; // мм
//1500*6000
//1250*2500
//1200*2000
  const scaleFactor = 0.1; // Масштабный коэффициент для визуализации
  const pixelSheetWidth = sheetWidth * scaleFactor;
  const pixelSheetHeight = sheetHeight * scaleFactor;


   const calculateCutting = () => {
    const count = Number(requestedPartCount);
    if (isNaN(count) || count <= 0) {
      console.error("Invalid requestedPartCount:", requestedPartCount);
      return;
    }

    const parts = Array(count).fill().map((_, index) => ({
      id: `part-${index}`,
      width: partWidth,
      height: partHeight,
    }));

    const packedSheets = binPacking(parts, sheetWidth, sheetHeight);

    const totalParts = packedSheets.reduce((total, sheet) => total + sheet.length, 0);
    const totalPartsArea = parts.reduce((totalArea, part) => totalArea + (part.width * part.height), 0);
    const totalSheetsArea = packedSheets.length * sheetWidth * sheetHeight;

    const usagePercentage = (totalPartsArea / totalSheetsArea) * 100;
    const remainingArea = totalSheetsArea - totalPartsArea;
    const remainingPercentage = (remainingArea / totalSheetsArea) * 100;

    setSheets(packedSheets);
    setPartCount(totalParts);
    setCurrentSheet(0);
    setUsagePercentage(usagePercentage.toFixed(2));
    setRemainingPercentage(remainingPercentage.toFixed(2));

    // Обновление количества повторяющихся листов
    setRepeatedSheetsCount(packedSheets.length);
  };

const binPacking = (parts, binWidth, binHeight) => {
  parts.sort((a, b) => (b.height * b.width) - (a.height * a.width));

  const bins = [[]];
  let currentX = 0;
  let currentY = 0;

  parts.forEach((part) => {
    if (currentY + part.height > binHeight) {
      currentX = 0;
      currentY = 0;
      bins.push([]);
    }

    if (currentX + part.width > binWidth) {
      currentX = 0;
      currentY += part.height;
    }

    bins[bins.length - 1].push({
     ...part,
      x: currentX,
      y: currentY,
    });

    currentX += part.width;
  });

  return bins;
};





 const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedPart(id);

    // Заменяем стандартный фантом на прозрачное изображение
    const img = new Image();
    img.src = ""; // пустая строка, создающая прозрачный фантом
    e.dataTransfer.setDragImage(img, 0, 0);
};


const handleDragOver = (e) => {
  e.preventDefault();
  if (draggedPart) {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const draggedPartData = sheets[currentSheet].find(
      (part) => part.id === draggedPart
    );

    // Приведение к сетке
    const newX = Math.round(((x / rect.width) * sheetWidth) / gridSize) * gridSize;
    const newY = Math.round(((y / rect.height) * sheetHeight) / gridSize) * gridSize;

    // Проверка на пересечение с другими деталями
    const otherParts = sheets[currentSheet].filter(
      (part) => part.id!== draggedPart
    );

    let adjustedX = newX;
    let adjustedY = newY;

    // Проверка на примагничивание к другим деталям
    otherParts.forEach((part) => {
      const distanceX = Math.abs(newX - part.x);
      const distanceY = Math.abs(newY - part.y);

      if (distanceX < 10) {
        // Примагничивание по горизонтали
        adjustedX = part.x;
      } else if (distanceX < part.width + 10 && distanceX > part.width - 10) {
        // Примагничивание по правому краю
        adjustedX = part.x + part.width;
      }

      if (distanceY < 10) {
        // Примагничивание по вертикали
        adjustedY = part.y;
      } else if (distanceY < part.height + 10 && distanceY > part.height - 10) {
        // Примагничивание по нижнему краю
        adjustedY = part.y + part.height;
      }
    });

    // Проверка на пересечение с границами листа
    if (adjustedX < 0) {
      adjustedX = 0;
    } else if (adjustedX + draggedPartData.width > sheetWidth) {
      adjustedX = sheetWidth - draggedPartData.width;
    }

    if (adjustedY < 0) {
      adjustedY = 0;
    } else if (adjustedY + draggedPartData.height > sheetHeight) {
      adjustedY = sheetHeight - draggedPartData.height;
    }

    // Проверка на наложение на другие детали
    const isOverlapping = otherParts.some((part) => {
      if (adjustedX + draggedPartData.width <= part.x || adjustedX >= part.x + part.width) return false;
      if (adjustedY + draggedPartData.height <= part.y || adjustedY >= part.y + part.height) return false;
      return true;
    });

    if (!isOverlapping) {
      const newSheets = sheets.map((sheet, index) => {
        if (index === currentSheet) {
          return sheet.map((part) =>
            part.id === draggedPart
           ? {
               ...part,
                  x: adjustedX,
                  y: adjustedY,
                }
              : part
          );
        }
        return sheet;
      });

      setSheets(newSheets);
    }
  }
};

const findNearestPosition = (parts, width, height, x, y) => {
  let nearestPosition = null;
  let minDistance = Infinity;

  parts.forEach((part) => {
    if (part.x + part.width <= x || part.y + part.height <= y) {
      return;
    }

    const distanceX = Math.abs(part.x - x);
    const distanceY = Math.abs(part.y - y);

    if (distanceX < minDistance && distanceY < minDistance) {
      const newX = part.x + (part.width - width) + 10; // добавляем 10 пикселей к координате X
      const newY = part.y + (part.height - height) + 10; // добавляем 10 пикселей к координате Y

      minDistance = Math.max(distanceX, distanceY);
      nearestPosition = { x: newX, y: newY };
    }
  });

  return nearestPosition;
};


const handleDrop = (e) => {
    e.preventDefault();
    setDraggedPart(null);
};



// Проверка на пересечение
const checkOverlap = (parts, x, y, width, height) => {
    return parts.some((part) => {
        return (
            x < part.x + part.width &&
            x + width > part.x &&
            y < part.y + part.height &&
            y + height > part.y
        );
    });
};


 const nextSheet = () => {
  if (currentSheet < sheets.length - 1) {
    setCurrentSheet(currentSheet + 1);
  }
};

const prevSheet = () => {
  if (currentSheet > 0) {
    setCurrentSheet(currentSheet - 1);
  }
};


const findAvailableSpace = (sheet, partWidth, partHeight) => {
  let availableSpaces = [{ x: 0, y: 0, width: sheetWidth, height: sheetHeight }];

  sheet.forEach((part) => {
    let newSpaces = [];
    availableSpaces.forEach((space) => {
      if (
        part.x + part.width <= space.x ||
        part.y + part.height <= space.y ||
        part.x >= space.x + space.width ||
        part.y >= space.y + space.height
      ) {
        newSpaces.push(space);
      } else {
        if (part.x > space.x) {
          newSpaces.push({
            x: space.x,
            y: space.y,
            width: part.x - space.x,
            height: space.height
          });
        }
        if (part.y > space.y) {
          newSpaces.push({
            x: Math.max(space.x, part.x),
            y: space.y,
            width: space.width - (Math.min(space.x + space.width, part.x + part.width) - Math.max(space.x, part.x)),
            height: part.y - space.y
          });
        }
        if (part.x + part.width < space.x + space.width) {
          newSpaces.push({
            x: part.x + part.width,
            y: space.y,
            width: space.x + space.width - (part.x + part.width),
            height: space.height
          });
        }
        if (part.y + part.height < space.y + space.height) {
          newSpaces.push({
            x: Math.max(space.x, part.x),
            y: part.y + part.height,
            width: Math.min(space.x + space.width, part.x + part.width) - Math.max(space.x, part.x),
            height: space.y + space.height - (part.y + part.height)
          });
        }
      }
    });
    availableSpaces = newSpaces;
  });

  // Попытка разместить деталь по столбцам
  availableSpaces.sort((a, b) => a.x - b.x || a.y - b.y);

  for (let space of availableSpaces) {
    if (space.width >= partWidth && space.height >= partHeight) {
      return {
        x: space.x,
        y: space.y
      };
    }
  }

  return null;
};

const placePartOnSheet = (sheet, partWidth, partHeight) => {
  console.log(`Placing part: ${partWidth} x ${partHeight}`); // Лог размещения

  for (let x = 0; x <= sheetWidth - partWidth; x += partWidth) {
    for (let y = 0; y <= sheetHeight - partHeight; y += partHeight) {
      let canPlace = true;
      for (let placedPart of sheet) {
        if (
          x < placedPart.x + placedPart.width &&
          x + partWidth > placedPart.x &&
          y < placedPart.y + placedPart.height &&
          y + partHeight > placedPart.y
        ) {
          canPlace = false;
          break;
        }
      }
      if (canPlace) {
        console.log(`Placed at: ${x}, ${y}`); // Лог координат размещения
        return { x, y };
      }
    }
  }
  return null;
};



// Обработчик изменения значения в поле ввода количества деталей
    const handlePartCountInputChange = (e) => {
        setNewPartCountInput(Number(e.target.value));
    };

    // Обработчик добавления новых деталей
  const addNewPart = (e) => {
  e.preventDefault();
  setError(""); // Сброс ошибки перед началом проверки

  if (newPartWidth && newPartHeight && newPartCountInput > 0) {
    const newPartWidthValue = Number(newPartWidth);
    const newPartHeightValue = Number(newPartHeight);

    if (newPartWidthValue > sheetWidth || newPartHeightValue > sheetHeight) {
      setError("Размер детали превышает размеры листа.");
      return;
    }

    if (newPartWidthValue > 2000 || newPartHeightValue > 2000) {
      setError("Размер детали превышает максимально допустимый размер (2000 мм).");
      return;
    }

    // Проверяем, существует ли уже деталь с такими же размерами
    const existingPartIndex = parts.findIndex(
      part => part.width === newPartWidthValue && part.height === newPartHeightValue
    );

    let updatedParts = [...parts];

    if (existingPartIndex!== -1) {
      // Если деталь уже существует, увеличиваем количество
      updatedParts[existingPartIndex] = {
       ...updatedParts[existingPartIndex],
        count: updatedParts[existingPartIndex].count + newPartCountInput
      };
    } else {
      // Если деталь новая, добавляем её в таблицу
      const newPart = {
        id: `part-${Date.now()}`,
        width: newPartWidthValue,
        height: newPartHeightValue,
        count: newPartCountInput,
      };
      updatedParts = [...updatedParts, newPart];
    }

    // Обновляем состояние с новыми или обновленными частями
    setParts(updatedParts);

    // Логика размещения деталей на листах
    let allParts = [];
    updatedParts.forEach(part => {
      for (let i = 0; i < part.count; i++) {
        allParts.push({
         ...part,
          id: `part-instance-${part.id}-${i}`, // Уникальный ID для каждой детали
        });
      }
    });

    allParts = allParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    let updatedSheets = [[]];
    allParts.forEach((part) => {
      let placed = false;

      for (let i = 0; i < updatedSheets.length; i++) {
        let sheet = updatedSheets[i];
        let space = findAvailableSpace(sheet, part.width, part.height);

        if (space) {
          sheet.push({...part, x: space.x, y: space.y });
          placed = true;
          break;
        }
      }

      if (!placed) {
        updatedSheets.push([{...part, x: 0, y: 0 }]);
      }
    });

    // Обновляем состояние с новыми листами
    setSheets(updatedSheets);

    // Обновляем оригинальные позиции
    const newOriginalPositions = {};
  updatedSheets.forEach((sheet) => {
    sheet.forEach((part) => {
      newOriginalPositions[part.id] = { x: part.x, y: part.y };
    });
  });
  setOriginalPositions(newOriginalPositions);

    // Пересчитываем использование и остаток
    const totalSheetArea = updatedSheets.length * sheetWidth * sheetHeight;
    const totalPartsArea = updatedSheets
     .flat()
     .reduce((sum, part) => sum + part.width * part.height, 0);
    const utilization = (totalPartsArea / totalSheetArea) * 100;
    const remainingArea = totalSheetArea - totalPartsArea;
    const remainingPercent = (remainingArea / totalSheetArea) * 100;

    setUsagePercentage(utilization.toFixed(2));
    setRemainingPercentage(remainingPercent.toFixed(2));
    setPartCount(allParts.length);
    setRepeatedSheetsCount(updatedSheets.length);

    // Сброс полей формы после успешного добавления деталей
    setNewPartWidth("");
    setNewPartHeight("");
    setNewPartCountInput("");
    setShowNewPartForm(false);
  } else {
    setError("Пожалуйста, заполните все поля корректно.");
  }
};



  const handleAddNewPart = () => {
    const width = parseFloat(newPartWidth);
    const height = parseFloat(newPartHeight);
    const count = parseInt(newPartCount, 10);

    if (isNaN(width) || isNaN(height) || isNaN(count) || width <= 0 || height <= 0 || count <= 0) {
      setError("Пожалуйста, введите корректные значения.");
      return;
    }

    const newParts = Array(count).fill().map((_, index) => ({
      id: `part-${Date.now()}-${index}`,
      width,
      height,
    }));

    let allParts = [...sheets.flat(), ...newParts];
    allParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    let updatedSheets = [[]];
    allParts.forEach((part) => {
      let placed = false;

      for (let i = 0; i < updatedSheets.length; i++) {
        let sheet = updatedSheets[i];
        let space = findAvailableSpace(sheet, part.width, part.height);

        if (space) {
          sheet.push({ ...part, x: space.x, y: space.y });
          placed = true;
          break;
        }
      }

      if (!placed) {
        updatedSheets.push([{ ...part, x: 0, y: 0 }]);
      }
    });

    setSheets(updatedSheets);
    setPartCount(updatedSheets.flat().length); // Обновление количества деталей

    const newOriginalPositions = {};
    updatedSheets.forEach((sheet) => {
      sheet.forEach((part) => {
        newOriginalPositions[part.id] = { x: part.x, y: part.y };
      });
    });
    setOriginalPositions(newOriginalPositions);

    const totalSheetArea = updatedSheets.length * sheetWidth * sheetHeight;
    const totalPartsArea = updatedSheets
      .flat()
      .reduce((sum, part) => sum + part.width * part.height, 0);
    const utilization = (totalPartsArea / totalSheetArea) * 100;
    const remainingArea = totalSheetArea - totalPartsArea;
    const remainingPercent = (remainingArea / totalSheetArea) * 100;

    setUsagePercentage(utilization.toFixed(2));
    setRemainingPercentage(remainingPercent.toFixed(2));
    setError(""); // Очистка ошибок
  };

  const deletePart = (partId) => {
  // Удаляем деталь из массива parts
  const updatedParts = parts.filter((part) => part.id!== partId);

  // Обновляем состояние с новыми частями
  setParts(updatedParts);

  // Удаляем детали из всех листов
  const updatedSheets = sheets.map((sheet) =>
    sheet.filter((part) => part.id!== partId &&!part.id.startsWith(`part-instance-${partId}-`))
  );

  // Удаляем пустые листы
  const filteredSheets = updatedSheets.filter((sheet) => sheet.length > 0);

  // Обновляем состояние с новыми листами
  setSheets(filteredSheets);

  // Пересчитываем размещение оставшихся деталей
  let allParts = [];
  updatedParts.forEach((part) => {
    for (let i = 0; i < part.count; i++) {
      allParts.push({
       ...part,
        id: `part-instance-${part.id}-${i}`, // Уникальный ID для каждой детали
      });
    }
  });

  allParts = allParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  let newSheets = [[]];
  allParts.forEach((part) => {
    let placed = false;

    for (let i = 0; i < newSheets.length; i++) {
      let sheet = newSheets[i];
      let space = findAvailableSpace(sheet, part.width, part.height);

      if (space) {
        sheet.push({...part, x: space.x, y: space.y });
        placed = true;
        break;
      }
    }

    if (!placed) {
      newSheets.push([{...part, x: 0, y: 0 }]);
    }
  });

  // Обновляем состояние с новыми листами
  setSheets(newSheets);

  // Обновляем оригинальные позиции
  const newOriginalPositions = {};
  newSheets.forEach((sheet) => {
    sheet.forEach((part) => {
      newOriginalPositions[part.id] = { x: part.x, y: part.y };
    });
  });
  setOriginalPositions(newOriginalPositions);

  // Пересчитываем использование и остаток
  const totalSheetArea = newSheets.length * sheetWidth * sheetHeight;
  const totalPartsArea = newSheets
   .flat()
   .reduce((sum, part) => sum + part.width * part.height, 0);
  const utilization = (totalPartsArea / totalSheetArea) * 100;
  const remainingArea = totalSheetArea - totalPartsArea;
  const remainingPercent = (remainingArea / totalSheetArea) * 100;

  setUsagePercentage(utilization.toFixed(2));
  setRemainingPercentage(remainingPercent.toFixed(2));
  setPartCount(allParts.length);
  setRepeatedSheetsCount(newSheets.length);
};


const incrementPartCount = (partId) => {
  const updatedParts = parts.map((part) => {
    if (part.id === partId) {
      return {...part, count: part.count + 1 };
    }
    return part;
  });

  setParts(updatedParts);

  // Логика размещения деталей на листах
  let allParts = [];
  updatedParts.forEach((part) => {
    for (let i = 0; i < part.count; i++) {
      allParts.push({
       ...part,
        id: `part-instance-${part.id}-${i}`, // Уникальный ID для каждой детали
      });
    }
  });

  allParts = allParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  let updatedSheets = [[]];
  allParts.forEach((part) => {
    let placed = false;

    for (let i = 0; i < updatedSheets.length; i++) {
      let sheet = updatedSheets[i];
      let space = findAvailableSpace(sheet, part.width, part.height);

      if (space) {
        sheet.push({...part, x: space.x, y: space.y });
        placed = true;
        break;
      }
    }

    if (!placed) {
      updatedSheets.push([{...part, x: 0, y: 0 }]);
    }
  });

  setSheets(updatedSheets);

  // Обновляем оригинальные позиции
  const newOriginalPositions = {};
  updatedSheets.forEach((sheet) => {
    sheet.forEach((part) => {
      newOriginalPositions[part.id] = { x: part.x, y: part.y };
    });
  });
  setOriginalPositions(newOriginalPositions);

  // Пересчитываем использование и остаток
  const totalSheetArea = updatedSheets.length * sheetWidth * sheetHeight;
  const totalPartsArea = updatedSheets
   .flat()
   .reduce((sum, part) => sum + part.width * part.height, 0);
  const utilization = (totalPartsArea / totalSheetArea) * 100;
  const remainingArea = totalSheetArea - totalPartsArea;
  const remainingPercent = (remainingArea / totalSheetArea) * 100;

  setUsagePercentage(utilization.toFixed(2));
  setRemainingPercentage(remainingPercent.toFixed(2));
  setPartCount(allParts.length);
  setRepeatedSheetsCount(updatedSheets.length);
};

const decrementPartCount = (partId) => {
  const updatedParts = parts.map((part) => {
    if (part.id === partId && part.count > 1) {
      return {...part, count: part.count - 1 };
    }
    return part;
  });

  setParts(updatedParts);

  // Логика размещения деталей на листах
  let allParts = [];
  updatedParts.forEach((part) => {
    for (let i = 0; i < part.count; i++) {
      allParts.push({
       ...part,
        id: `part-instance-${part.id}-${i}`, // Уникальный ID для каждой детали
      });
    }
  });

  allParts = allParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  let updatedSheets = [[]];
  allParts.forEach((part) => {
    let placed = false;

    for (let i = 0; i < updatedSheets.length; i++) {
      let sheet = updatedSheets[i];
      let space = findAvailableSpace(sheet, part.width, part.height);

      if (space) {
        sheet.push({...part, x: space.x, y: space.y });
        placed = true;
        break;
      }
    }

    if (!placed) {
      updatedSheets.push([{...part, x: 0, y: 0 }]);
    }
  });

  setSheets(updatedSheets);

  // Обновляем оригинальные позиции
  const newOriginalPositions = {};
  updatedSheets.forEach((sheet) => {
    sheet.forEach((part) => {
      newOriginalPositions[part.id] = { x: part.x, y: part.y };
    });
  });
  setOriginalPositions(newOriginalPositions);

  // Пересчитываем использование и остаток
  const totalSheetArea = updatedSheets.length * sheetWidth * sheetHeight;
  const totalPartsArea = updatedSheets
   .flat()
   .reduce((sum, part) => sum + part.width * part.height, 0);
  const utilization = (totalPartsArea / totalSheetArea) * 100;
  const remainingArea = totalSheetArea - totalPartsArea;
  const remainingPercent = (remainingArea / totalSheetArea) * 100;

  setUsagePercentage(utilization.toFixed(2));
  setRemainingPercentage(remainingPercent.toFixed(2));
  setPartCount(allParts.length);
  setRepeatedSheetsCount(updatedSheets.length);
};
const countCuts = (sheets, sheetWidth, sheetHeight) => {
  let totalCuts = 0;

  sheets.forEach((sheet) => {
    const cuts = new Set();

    const sortedParts = sheet.sort((a, b) => a.y - b.y || a.x - b.x);

    sortedParts.forEach((part, index) => {
      // Сравнение с предыдущими частями
      if (index > 0) {
        const prevPart = sortedParts[index - 1];
        if (part.y > prevPart.y + prevPart.height) {
          cuts.add(`horizontal-${Math.min(prevPart.y + prevPart.height, part.y)}`);
        }
        if (part.x > prevPart.x + prevPart.width && part.y === prevPart.y) {
          cuts.add(`vertical-${Math.min(prevPart.x + prevPart.width, part.x)}`);
        }
      }

      // Учитываем рубы по границам детали
      if (part.x > 0) {
        cuts.add(`vertical-${part.x}`);
      }
      if (part.x + part.width < sheetWidth) {
        cuts.add(`vertical-${part.x + part.width}`);
      }
      if (part.y > 0) {
        cuts.add(`horizontal-${part.y}`);
      }
      if (part.y + part.height < sheetHeight) {
        cuts.add(`horizontal-${part.y + part.height}`);
      }
    });

    totalCuts += cuts.size; 
  });

  return totalCuts;
};

// Пример использования:

const cuts = countCuts(sheets, sheetWidth, sheetHeight);

const width = Math.max(...sheets[currentSheet].map(part => part.x + part.width)) - Math.min(...sheets[currentSheet].map(part => part.x));
const roundedWidth = Math.ceil(width / 500) * 500;
const maxHeight = Math.max(...sheets[currentSheet].map(part => part.y + part.height));
const roundedHeight = Math.ceil(maxHeight / 500) * 500;

const maxWidth = 1500; // максимальная ширина листа
const actualWidth = Math.min(roundedWidth, maxWidth); // учтите максимальную ширину листа
const actualHeight = Math.min(roundedHeight, sheetHeight);

// Находим минимальные и максимальные значения по осям x и y для всех деталей
const minX = Math.min(...sheets[currentSheet].map(part => part.x));
const maxX = Math.max(...sheets[currentSheet].map(part => part.x + part.width));
const minY = Math.min(...sheets[currentSheet].map(part => part.y));
const maxY = Math.max(...sheets[currentSheet].map(part => part.y + part.height));

// Определяем свободное пространство вокруг деталей
const freeLeft = minX;
const freeRight = sheetWidth - maxX;
const freeTop = minY;
const freeBottom = sheetHeight - maxY;

// Сумма длины и ширины свободного пространства в миллиметрах
const sumOfDimensions = sheetWidth - Math.max(...sheets[currentSheet].map(part => part.x + part.width));



function calculateSheetCost(roundedWidth, minProdazha, weight1, sale_Ton) {
  // Преобразуем minProdazha в число
  minProdazha = parseFloat(minProdazha.replace(',', '.'));

  // Переводим ширину в метры
  const widthInMeters = roundedWidth / 1000; 

  // Преобразуем значение weight1 из строки с запятой в строку с точкой
  let weight1Float;
  if (typeof weight1 === 'number') {
    weight1Float = weight1;
  } else {
    weight1Float = parseFloat(weight1.toString().replace(',', '.'));
  }

  // Проверка на 0 и очень маленькие значения
  if (weight1Float === 0 || sale_Ton === 0 || roundedWidth === 0 || minProdazha === 0) {
    return 0; // Возвращаем 0, если одно из значений равно 0
  } else if (weight1Float < 0.001 || sale_Ton < 0.001 || roundedWidth < 0.001 || minProdazha < 0.001) {
    return 0; // Возвращаем 0, если одно из значений очень маленькое
  } else { 
    // Вычисляем стоимость листа 

    const sheetCost = (1/6) * widthInMeters * weight1Float * sale_Ton;
    console.log('1', widthInMeters);
    console.log('3', minProdazha);
    console.log('3' ,sale_Ton);
    return parseFloat(sheetCost.toFixed(2)); 
  }
}

// Вычисление стоимости листа
const sheetCost = calculateSheetCost(roundedWidth, minProdazha, weight1, sale_Ton);


// Рассчет стоимости рубов
function calculateRubsCost(cuts, sale_service) {
  // Вычисляем стоимость рубов
  const rubsCost = cuts * sale_service;
  return parseFloat(rubsCost.toFixed(2));
}
const rubsCost = calculateRubsCost(cuts, sale_service);




// Рассчет суммы итого
function calculateTotalCost(sheetCost, rubsCost) {
  // Вычисляем сумму итого
  const totalCost = sheetCost + rubsCost;
  return parseFloat(totalCost.toFixed(2));
}
const totalCost = calculateTotalCost(sheetCost, rubsCost);


const formatPrice = (price) => {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(price));
};


  return (
    

    <div className="relative overflow-hidden background-gradient">
      <div className="absolute inset-0 -z-10"></div>
      <div className="relative z-10 container mx-auto p-6 md:p-10 bg-white shadow-lg rounded-lg background-color-block">
        <div className="max-w-sm mx-auto">
  <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800
      bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 
      shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out
      tracking-tight leading-tight text_nazvanie">
    Калькулятор раскроя
  </h1>
</div>





        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
          <h2 className="text-xl font-weight-500 text-center mb-2 text_img text_img3">
            {naimenovanie}
          </h2>
          <div className="top_img_text top_img_text_3" style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
        <FaCheck style={{ color: '#f2a900', marginRight: '5px' }} />
        <span className="span_text_img">В наличии менее 1 тн</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <FaClock style={{ color: '#f2a900', marginRight: '5px' }} />
        <span className="span_text_img">в пути 3 тн</span>
      </div>
      </div>
          <img src={imageSrc} className="img_list mb-4 img_list_rubka" alt="Product" />
           <div className="ml-50px">
          <div className="flex flex-col">
            <div>
              <table className="table-custom table_rubka">
                <thead>
                  <tr>
                    <th>Длина:</th>
                    <th>Масса:</th>
                    <th>Цена за метр:</th>
                    <th>Цена за штуку:</th>
                    <th>Цена за тонну:</th>
                  </tr>
                </thead>
                <tbody>
                  {data && (
                    <tr>
                      <td>{data.leight}</td>
                      <td>{data.weight1}</td>
                      <td>{data.sale_metr}</td>
                      <td>{data.sale_shtuk}</td>
                      <td>{data.sale_ton}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div></div>
          <h2 className="text-2xl font-semibold mb-4 text-center">Размеры листа</h2>
            <table className="w-full mb-8 border-collapse border border-gray-300 rounded-lg overflow-hidden bg-gray-50 shadow-md">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-6 py-4 text-left text-gray-700">Параметр</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-gray-700">Значение</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-6 py-4">Длина листа</td>
                  <td className="border border-gray-300 px-6 py-4">{sheetWidth} мм</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-6 py-4">Ширина листа</td>
                  <td className="border border-gray-300 px-6 py-4">{sheetHeight} мм</td>
                </tr>
              </tbody>
            </table>

            

            
              <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-300 add_new_part">
                <h2 className="text-2xl font-semibold mb-4">Добавить новую деталь</h2>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <form onSubmit={addNewPart}>
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-600">Длина детали (мм)</label>
    <input
      type="number"
      value={newPartWidth}
      onChange={(e) => setNewPartWidth(Number(e.target.value))}
      className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-600">Ширина детали (мм)</label>
    <input
      type="number"
      value={newPartHeight}
      onChange={(e) => setNewPartHeight(Number(e.target.value))}
      className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-600">Количество деталей</label>
    <input
      type="number"
      value={newPartCountInput}
      onChange={handlePartCountInputChange}
      className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
  <div className="flex justify-end gap-4">
    <button
      type="submit"
      className="bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-indigo-700 transition"
    >
      Разместить
    </button>
    <button
      type="button"
      onClick={() => {
        setShowNewPartForm(false);
        setNewPartWidth(""); // Очистка поля для ширины детали
        setNewPartHeight(""); // Очистка поля для длины детали
        setNewPartCountInput(""); // Очистка поля для количества деталей
        setError(""); // Очистка сообщений об ошибках
      }}
      className="bg-red-600 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-red-700 transition"
    >
      Отмена
    </button>
  </div>
</form>

              </div>
            

            <div className="absolute top-[950px] right-[270px] mt-4 mr-4 mb-12 bg-white p-4 table_part">
              <h2 className="text-2xl font-semibold mb-4 text-center">Добавленные детали</h2>
              <div className="overflow-y-auto max-h-80">
  <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden bg-gray-50 shadow-md">
    <thead>
      <tr className="bg-gray-200">
        <th className="border border-gray-300 p-4 text-center text-gray-700">Длина детали (мм)</th>
        <th className="border border-gray-300 p-4 text-center text-gray-700">Ширина детали (мм)</th>
        <th className="border border-gray-300 p-4 text-center text-gray-700">Количество</th>
        <th className="border border-gray-300 p-10 text-center text-gray-700">Действие</th>
      </tr>
    </thead>
    <tbody>
          {parts.map((part) => (
            <tr key={part.id}>
              <td className="border border-gray-300 p-4 text-center">{part.width}</td>
              <td className="border border-gray-300 p-4 text-center">{part.height}</td>
              <td className="border border-gray-300 p-4 text-center flex justify-center items-center">
                <button
                  className="bg-gray-400 text-white px-2 py-1 rounded-lg shadow-lg hover:bg-gray-500 transition"
                  onClick={() => decrementPartCount(part.id)}
                >
                  -
                </button>
                <span className="mx-2">{part.count}</span>
                <button
                  className="bg-gray-400 text-white px-2 py-1 rounded-lg shadow-lg hover:bg-gray-500 transition"
                  onClick={() => incrementPartCount(part.id)}
                >
                  +
                </button>
              </td>
              <td className="border border-gray-300 p-4 text-center">
                <button
                  className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-red-700 transition"
                  onClick={() => deletePart(part.id)}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
</div>
            </div>
          </div>

          <div className="w-full md:w-1/3">
           <div
  className="border p-6 bg-gray-100 h-[400px] relative shadow-md"
  style={{ width: `${pixelSheetWidth*1.5}px`, height: `${pixelSheetHeight*1.5}px` }}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>

  <div className="absolute top-[225px] left-1/2 -translate-x-1/2 text-gray-500 font-bold text-xl tracking-wide" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}>
  {sheetWidth} мм (Длина)
</div>

<div className="absolute top-1/2 -translate-y-1/2 right-[-80px] text-gray-500 flex flex-col justify-center font-bold text-xl tracking-wide" style={{ writingMode: 'vertical-lr', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}>
  {sheetHeight} мм (Ширина)
</div>


              <div className="w-full h-full">
               {sheets[currentSheet] &&
  sheets[currentSheet].map((part) => (
    <div
      key={part.id}
      id={part.id}
      className="absolute bg-blue-500 cursor-move border border-gray-800"
      style={{
        left: `${(part.x / sheetWidth) * 100}%`,
        top: `${(part.y / sheetHeight) * 100}%`,
        width: `${(part.width / sheetWidth) * 100}%`,
        height: `${(part.height / sheetHeight) * 100}%`,
        transition: "all 0.1s ease-out",
        boxShadow: '0 0 0 0.5px black',
        zIndex: 1,
        position: 'absolute'
      }}
      draggable="true"
      onDragStart={(e) => handleDragStart(e, part.id)}
    >
      <div
        className="absolute top-1/2 right-1 text-xs text-white"
        style={{
          fontSize: '8px',
          whiteSpace: 'nowrap',
          transform: 'rotate(+90deg)'
        }}
      >
        {part.height} мм
      </div>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-white"
        style={{
          fontSize: '8px',
          transformOrigin: 'top center',
          whiteSpace: 'nowrap'
        }}
      >
        {part.width} мм
      </div>
    </div>
  ))}
  

  {sheets[currentSheet] && sheets[currentSheet].length > 0 && (
  <div
    className="absolute"
    style={{
      left: `${(Math.min(...sheets[currentSheet].map(part => part.x)) / sheetWidth) * 100}%`,
      top: '-20px',
      width: `${((Math.max(...sheets[currentSheet].map(part => part.x + part.width)) - Math.min(...sheets[currentSheet].map(part => part.x))) / sheetWidth) * 100}%`,
      height: '2px',
      backgroundColor: 'red',
      zIndex: 1000,
    }}
  />
)}

{sheets[currentSheet] && sheets[currentSheet].length > 0 && (
  <div
    className="absolute"
    style={{
      left: `${(Math.min(...sheets[currentSheet].map(part => part.x)) / sheetWidth) * 100}%`,
      top: '-40px',
      width: `${((Math.max(...sheets[currentSheet].map(part => part.x + part.width)) - Math.min(...sheets[currentSheet].map(part => part.x))) / sheetWidth) * 100}%`,
      fontSize: '12px',
      color: 'red',
      zIndex: 1000,
      textAlign: 'left',
    }}
  >
    <span style={{ position: 'relative', transform: 'translateX(-50%)' }}>
      {Math.max(...sheets[currentSheet].map(part => part.x + part.width)) - Math.min(...sheets[currentSheet].map(part => part.x))} мм
    </span>
  </div>
)}

{sheets[currentSheet] && sheets[currentSheet].length > 0 && (
  <div
    className="absolute"
    style={{
      left: '-10px',
      top: `${(Math.min(...sheets[currentSheet].map(part => part.y)) / sheetHeight) * 100}%`,
      width: '2px',
      height: `${((Math.max(...sheets[currentSheet].map(part => part.y + part.height)) - Math.min(...sheets[currentSheet].map(part => part.y))) / sheetHeight) * 100}%`,
      backgroundColor: 'blue',
      zIndex: 1000,
    }}
  />
)}

{sheets[currentSheet] && sheets[currentSheet].length > 0 && (
  <div
    className="absolute"
    style={{
      left: '-30px',
      top: `${(Math.min(...sheets[currentSheet].map(part => part.y)) / sheetHeight) * 100}%`,
      height: `${((Math.max(...sheets[currentSheet].map(part => part.y + part.height)) - Math.min(...sheets[currentSheet].map(part => part.y))) / sheetHeight) * 100}%`,
      fontSize: '12px',
      color: 'blue',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      writingMode: 'vertical-lr',
      transform: 'rotate(-0deg)',
    }}
  >
    <span style={{ position: 'relative', transform: 'translateY(-50%)' }}>
      {Math.max(...sheets[currentSheet].map(part => part.y + part.height)) - Math.min(...sheets[currentSheet].map(part => part.y))} мм
    </span>
  </div>
)}




{sheets[currentSheet] && sheets[currentSheet].length > 0 && (
  <div
    className="absolute"
    style={{
      left: `${(Math.min(...sheets[currentSheet].map(part => part.x)) / sheetWidth) * 100}%`,
      top: '-40px',
      width: `${(roundedWidth / sheetWidth) * 100}%`,
      height: '2px',
      backgroundColor: 'green',
      zIndex: 1000,
    }}
  />
)}

{sheets[currentSheet] && sheets[currentSheet].length > 0 && (
  <div
    className="absolute stripped"
    style={{
      left: `${(Math.min(...sheets[currentSheet].map(part => part.x)) / sheetWidth) * 100}%`,
      top: '0px',
      width: `${(roundedWidth / sheetWidth) * 100}%`,
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
    }}
  >
    <div
      className="absolute"
      style={{
        left: '0px',
        top: '-60px',
        width: '100%',
        fontSize: '12px',
        color: 'green',
        zIndex: 1000,
        textAlign: 'left',
      }}
    >
      <span style={{ position: 'relative', transform: 'translateX(0%)' }}>
        {roundedWidth} мм
      </span>
    </div>
  </div>
)}









 



              </div>
            </div>


            <div className="mt-8 flex justify-between items-center list_btn_list">
              <button
                onClick={prevSheet}
                disabled={currentSheet === 0}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg shadow-lg disabled:opacity-50 hover:bg-gray-500 transition"
              >
                <i className="fas fa-chevron-left"></i> Предыдущий лист
              </button>
              <span className="text-lg font-semibold">
                Лист {currentSheet + 1} из {sheets.length}
              </span>
              <button
                onClick={nextSheet}
                disabled={currentSheet === sheets.length - 1}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg shadow-lg disabled:opacity-50 hover:bg-gray-500 transition"
              >
                Следующий лист <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            <div className="mt-8">
  <h2 className="text-2xl font-semibold mb-4">Результаты:</h2>
  <p>Стоимость листа: <span className="font-semibold">{sheetCost} ₽.</span></p>
  <p>Стоимость рубов: <span className="font-semibold">{rubsCost} ₽.</span></p>
  
  <div className="flex items-center mt-4">
                  <h2 className="text-lg mr-2 price_text2">Сумма итого:</h2>
                  <p className="text-lg font-bold total-price_2">{formatPrice(totalCost)} ₽.</p>
                </div>
                <hr className="horizontal-line2" />
                <button className="add-to-cart-button">
                  В корзину
                </button>
  <p>Количество деталей: <span className="font-semibold">{partCount}</span></p>
  {/*<p>Процент использования: <span className="font-semibold">{usagePercentage}%</span></p>
  <p>Остаток: <span className="font-semibold">{remainingPercentage}%</span></p>*/}
  <p>Количество повторяющихся листов: <span className="font-semibold">{repeatedSheetsCount}</span></p>
  <p>Количество рубов: <span className="font-semibold">{cuts}</span></p>
  {/*<p>Расстояние по длине листа: <span className="font-semibold">{sheets[currentSheet] && sheets[currentSheet].length > 0? Math.max(...sheets[currentSheet].map(part => part.x + part.width)) - Math.min(...sheets[currentSheet].map(part => part.x)) : 0} мм</span></p>
<p>Расстояние по ширине листа: <span className="font-semibold">{sheets[currentSheet] && sheets[currentSheet].length > 0? Math.max(...sheets[currentSheet].map(part => part.y + part.height)) - Math.min(...sheets[currentSheet].map(part => part.y)) : 0} мм</span></p>
<p>Сумма длины и ширины заштрихованной области: <span className="font-semibold">{sumOfDimensions} мм</span></p>*/}
</div>

            <div className="absolute top-0 right-0 mt-4 mr-4 mb-12 bg-white p-4 shadow-md rounded" style={{ marginTop: '20px' }}>
    <h3 className="text-lg font-semibold mb-4">Легенда:</h3>
    <div className="flex items-center mb-2">
      <div className="w-6 h-6 bg-blue-500 border border-black mr-2"></div>
      <span>Деталь (можно перемещать)</span>
    </div>
    <div className="flex items-center mb-2">
      <div className="w-6 h-6 bg-gray-200 border mr-2"></div>
      <span>Лист</span>
    </div>
    <div className="flex items-center">
      <div className="w-6 h-6 border mr-2 bg-gray-200" style={{ backgroundImage: 'linear-gradient(45deg, black 25%, transparent 25%, transparent 50%, black 50%, black 75%, transparent 75%, transparent)', backgroundSize: '8px 8px' }}></div>
      <span>Остаток</span>
    </div>
  </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MainComponent;

