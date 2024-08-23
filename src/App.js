import React, { useState, useEffect } from "react";
import MainComponent from "./MainComponent";
import axios from "axios";
import { FaCheck } from 'react-icons/fa';
import { FaClock } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa';

function App() {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAddWithoutCutting, setShowAddWithoutCutting] = useState(false);
  const [metrov, setMetrov] = useState(0);
  const [shtuk, setShtuk] = useState(0);
  const [tonn, setTonn] = useState(0);
  const [data, setData] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [naimenovanie, setNaimenovanie] = useState("");
  const [sheetWidth, setSheetWidth] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [minProdazha, setMinProdazha] = useState(0); // State to store min_prodazha value
  const [weight1, setWeight1] = useState(0);
  const [sale_Ton, setsale_Ton] = useState(0);
  const [sale_service, setsale_service] = useState(0);

  const handleAddWithCutting = () => {
    setShowCalculator(true);
  };

  const handleAddWithoutCutting = () => {
    setShowAddWithoutCutting(true);
  };

  const handleCloseCalculator = () => {
    setShowCalculator(false);
  };

  const handleBackToChoice = () => {
    setShowAddWithoutCutting(false);
  };

  const startValue = () => {
    if (data && data.leight && data.weight1) {
      const weight1Value = parseFloat(data.weight1.replace(",", "."));
      setShtuk(1);
      setMetrov(parseFloat(data.leight));
      setTonn(weight1Value);
    }
  };

  const calculateTotalPrice = (metrov, shtuk, tonn, data) => {
  const saleMetrValue = parseFloat(data.sale_metr.replace(/\s+/g, '').replace(",", "."));
  const saleShtukValue = parseFloat(data.sale_shtuk.replace(/\s+/g, '').replace(",", "."));
  const saleTonValue = parseFloat(data.sale_ton.replace(/\s+/g, '').replace(",", "."));

  const priceByMetrov = metrov * saleMetrValue;
  const priceByShtuk = shtuk * saleShtukValue;
  const priceByTonn = tonn * saleTonValue;

  // Используем максимальное значение из расчетов
  const totalPrice = Math.max(priceByMetrov, priceByShtuk, priceByTonn);

  return totalPrice.toFixed(2);
};

const handleMetrovChange = (e) => {
  const value = parseFloat(e.target.value);
  if (!isNaN(value) && value >= 0) {
    const weight1Value = parseFloat(data.weight1.replace(",", "."));
    const newShtuk = value / parseFloat(data.leight);
    const newTonn = newShtuk * weight1Value;

    setMetrov(value);
    setShtuk(Math.round(newShtuk * 100) / 100);
    setTonn(Math.round(newTonn * 1000) / 1000);

    const totalPrice = calculateTotalPrice(value, Math.round(newShtuk), newTonn, data);
    setTotalPrice(totalPrice);
  } else {
    startValue();
  }
};

const handleShtukChange = (e) => {
  const value = parseFloat(e.target.value);
  if (!isNaN(value) && value >= 0) {
    const weight1Value = parseFloat(data.weight1.replace(",", "."));
    const leightValue = parseFloat(data.leight.replace(",", "."));
    const newMetrov = value * leightValue;
    const newTonn = value * weight1Value;

    setShtuk(value);
    setMetrov(Math.round(newMetrov * 100) / 100);
    setTonn(Math.round(newTonn * 1000) / 1000);

    const totalPrice = calculateTotalPrice(newMetrov, value, newTonn, data);
    setTotalPrice(totalPrice);
  } else {
    startValue();
  }
};

const handleTonnChange = (e) => {
  const value = parseFloat(e.target.value);
  if (!isNaN(value) && value >= 0) {
    const weight1Value = parseFloat(data.weight1.replace(",", "."));
    const leightValue = parseFloat(data.leight.replace(",", "."));
    
    const newShtuk = value / weight1Value;
    const newMetrov = newShtuk * leightValue;

    setTonn(value);
    setShtuk(Math.round(newShtuk * 100) / 100);
    setMetrov(Math.round(newMetrov * 100) / 100);

    const totalPrice = calculateTotalPrice(newMetrov, newShtuk, value, data);
    setTotalPrice(totalPrice);
  } else {
    startValue();
  }
};




 useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("https://app.netlify.com/sites/steady-banoffee-903971/deploys", {
          params: { kod: "УТ000000539" }
        });
        const item = response.data.find((item) => item.kod === "УТ000000539");
        setData(item);

        if (item) {
          setMinProdazha(item.min_prodazha);
          setWeight1(parseFloat(item.weight1.replace(",", ".")));
          setsale_Ton(parseFloat(item.sale_ton.replace(/\s+/g, '').replace(",", ".")));
          setsale_service(item.sale_service);
          if (item.naimenovanie) {
            const dimensions = item.naimenovanie.match(/(\d+,\d+)х(\d+,\d+)/);
            if (dimensions) {
              const width = parseFloat(dimensions[1].replace(",", ".")) * 1000; // Convert to mm
              const height = parseFloat(dimensions[2].replace(",", ".")) * 1000; // Convert to mm
              setSheetWidth(width);
              setSheetHeight(height);
            }
          }
          setNaimenovanie(item.naimenovanie); // Сохранение текста из столбца "naimenovanie"
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
  if (data && data.leight && data.weight1 && data.weight1 !== 0) {
    startValue();
  } else {
    console.error('Invalid data:', data);
  }
}, [data]);







const parseValue = (value) => {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/\s+/g, '').replace(",", "."));
  }
  return parseFloat(value);
};


useEffect(() => {
  if (showAddWithoutCutting) {
    const metrovValue = parseValue(metrov);
    const shtukValue = parseValue(shtuk);
    const tonnValue = parseValue(tonn);
    const saleMetrValue = parseValue(data.sale_metr || '0');
    const saleShtukValue = parseValue(data.sale_shtuk || '0');
    const saleTonValue = parseValue(data.sale_ton || '0');

    if (!isNaN(metrovValue) && !isNaN(shtukValue) && !isNaN(tonnValue) &&
        !isNaN(saleMetrValue) && !isNaN(saleShtukValue) && !isNaN(saleTonValue)) {
      
      // Предположим, мы используем только одно из значений: метры, штуки или тонны
      const totalPrice = (metrovValue * saleMetrValue/3) + 
                         (shtukValue * saleShtukValue/3) + 
                         (tonnValue * saleTonValue/3);
      
      setTotalPrice(totalPrice.toFixed(2));
    } else {
      console.error('Invalid values for calculation:', {
        metrovValue, shtukValue, tonnValue, saleMetrValue, saleShtukValue, saleTonValue
      });
      setTotalPrice(0);
    }
  } else {
    setTotalPrice(0);
  }
}, [data, metrov, shtuk, tonn, showAddWithoutCutting]);







 const formatPrice = (price) => {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(price));
};
const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    border: '2px solid #e4c678', // Цвет границы
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: 'Montserrat',
    marginTop: '30px',
    marginBottom: '30px',
  },
  text: {
    marginRight: '10px',
    color: '#4a4a4a',
  },
  icon: {
    color: '#e19e3a',
  },
};
const imageSrc = data?.image ? `https://www.prof-stal42.ru/userfiles/image/catalog/z${data.image}.jpg` : "https://new.prof-stal42.ru/userfiles/image/catalog/z1617436895.jpg";
 




  return (
    <div className="flex flex-col h-screen">
      <div className="flex p-4">
        <div className="w-auto">
          <h2 className="text-xl font-weight-500 text-center mb-2 text_img">
            {naimenovanie}
          </h2>
          <div className="top_img_text" style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
        <FaCheck style={{ color: '#f2a900', marginRight: '5px' }} />
        <span className="span_text_img">В наличии менее 1 тн</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <FaClock style={{ color: '#f2a900', marginRight: '5px' }} />
        <span className="span_text_img">в пути 3 тн</span>
      </div>
    </div>
  
          <img src={imageSrc} className="img_list" alt="Product"  />
        </div>
        <div className="ml-50px">
          <div className="flex flex-col">
            <div>
              <table className="table-custom">
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

            {showAddWithoutCutting ? (
              <div className="block_1">
                <div className="flex items-center">
  <h2 className="text-lg mt-4 text_kol">Выберите количество:</h2>
  <div className="text_icon flex items-center ml-4">
    <img className="icon_1" src="/icon_1.png" width="32px" height="32px" alt="Icon" />
    <span className="ml-2">Заказ кратно штукам!</span></div>
</div>
                <div className="flex">
                  <div className="flex flex-col">
                    <label className="text-sm">Метров:</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={metrov}
                        onChange={handleMetrovChange}
                        placeholder="0"
                        min="0"
                        step="0.5"
                        className="w-full p-2 border border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-sm2">Тонн:</label>
                    <input
                      
                      type="number"
                      value={tonn}
                      onChange={handleTonnChange}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full p-2 border border-gray-200 textsm2"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-sm3">Штук:</label>
                    <input
                      type="number"
                      value={shtuk}
                      onChange={handleShtukChange}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="w-full p-2 border border-gray-200 textsm3"
                    />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <h2 className="text-lg mr-2 price_text">Сумма итого:</h2>
                  <p className="text-lg font-bold total-price">{formatPrice(totalPrice)} ₽.</p>
                </div>
                <hr className="horizontal-line" />
                <button style={styles.button}>
      <span style={styles.text}>Дополнительные услуги</span>
      <FaChevronRight style={styles.icon} />
    </button>

                <button className="add-to-cart-button">
                  В корзину
                </button>
                <button
                  onClick={handleBackToChoice}
                  className="bg-[#E19E3A] text-white py-2 px-4 rounded-lg shadow-lg hover:bg-[#FFC499] transition mt-4 Back_vybor"
                >
                  Назад к выбору
                </button>
              </div>
            ) : (
              !showCalculator && (
                <div className="flex justify-between mt-12">
                  <button
                    onClick={handleAddWithCutting}
                    className="bg-[#E19E3A] text-white py-2 px-4 rounded-lg shadow-lg hover:bg-[#FFC499] transition btn_bez_rubki"
                  >
                    Добавить лист с порубкой
                  </button>
                  <button
                    onClick={handleAddWithoutCutting}
                    className="bg-[#E19E3A] text-white py-2 px-4 rounded-lg shadow-lg hover:bg-[#FFC499] transition btn_bez_rubki"
                  >
                    Добавить лист без порубки
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {showCalculator && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 w-4/4 h-3/4 overflow-y-auto">
            <button
              onClick={handleCloseCalculator}
              className="bg-[#E19E3A] text-white py-2 px-4 rounded-lg shadow-lg hover:bg-[#FFC499] transition absolute top-4 right-4"
            >
              Закрыть
            </button>
            <MainComponent 
              sheetWidth={sheetHeight} 
              sheetHeight={sheetWidth} 
              minProdazha={minProdazha} 
              weight1={weight1}
              sale_Ton={sale_Ton}
              sale_service={sale_service}
              imageSrc={imageSrc}
              naimenovanie={naimenovanie}
              data={data}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
