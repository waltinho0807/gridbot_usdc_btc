const ccxt = require('ccxt');
const fs = require('fs');
const config = require('./config');
require('dotenv').config();

function log(msg) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

function saveOrders(buyOrders, sellOrders) {
    fs.writeFileSync('orders.json', JSON.stringify({ buyOrders, sellOrders }, null, 2));
}

(async function () {

    console.log(config.API_KEY, process.env.API_KEY, config.SECRET_KEY )
    const exchange = new ccxt.binance({
        apiKey: process.env.API_KEY,
        secret: process.env.SECRET_KEY,
        enableRateLimit: true,
    });

    log(`Iniciando bot para ${config.SYMBOL}`);

    const ticker = await exchange.fetchTicker(config.SYMBOL);
    const price = ticker.bid;

    const balance = await exchange.fetchBalance();
    const quoteCurrency = config.SYMBOL.split('/')[1]; // Ex: USDT
    const availableFunds = balance.free[quoteCurrency];

    const requiredFunds = config.POSITION_SIZE * (config.NUM_BUY_GRID_LINES +  config.NUM_SELL_GRID_LINES);
    if (requiredFunds > availableFunds) {
        log(`❌ Saldo insuficiente. Requerido: ${requiredFunds}, Disponível: ${availableFunds}`);
        process.exit(1);
    }

    let buyOrders = [];
    let sellOrders = [];

    // Criar ordens de compra (abaixo do preço atual)
    for (let i = 1; i <= config.NUM_BUY_GRID_LINES; ++i) {
        let buyPrice = price - (config.GRID_SIZE * i);
        const amountBTC = +(config.POSITION_SIZE / buyPrice).toFixed(6); // quantidade real de BTC

        log(`🟢 Criando ordem de COMPRA em ${buyPrice} com ${amountBTC} BTC`);
        const order = await exchange.createLimitBuyOrder(config.SYMBOL, amountBTC, buyPrice);
        buyOrders.push({ ...order.info, amount: amountBTC });
    }

    // Criar ordens de venda (acima do preço atual)
    for (let i = 1; i <= config.NUM_SELL_GRID_LINES; ++i) {
        let sellPrice = price + (config.GRID_SIZE * i);
        //log(`🔴 Criando ordem de VENDA em ${sellPrice}`);
        //const order = await exchange.createLimitSellOrder(config.SYMBOL, config.POSITION_SIZE, sellPrice);
        //sellOrders.push(order.info);
    }

    saveOrders(buyOrders, sellOrders);

    while (true) {
        let closedOrderIds = [];

        const tickerNow = await exchange.fetchTicker(config.SYMBOL);
        const currentPrice = tickerNow.last;

        // Stop loss
        if (currentPrice <= config.STOP_LOSS_PRICE) {
            log(`🚨 Stop Loss atingido: ${currentPrice} <= ${config.STOP_LOSS_PRICE}`);
            await exchange.cancelAllOrders(config.SYMBOL);
            process.exit(1);
        }

        for (const buyOrder of buyOrders) {
            try {
                const order = await exchange.fetchOrder(buyOrder.id);
                if (order.info.status === config.CLOSED_ORDER_STATUS) {
                    log(`✅ Ordem de compra executada a ${order.price}`);
                    closedOrderIds.push(order.id);
                    // Criar ordem de venda com mesma quantidade de BTC comprada
                    const buyAmountBTC = parseFloat(buyOrder.amount);
                    const newSellPrice = parseFloat(order.price) + config.GRID_SIZE;
                    log(`🔁 Criando nova VENDA em ${newSellPrice}`);
                    const newSell = await exchange.createLimitSellOrder(config.SYMBOL, buyAmountBTC, newSellPrice);
                    sellOrders.push({ ...newSell.info, amount: buyAmountBTC });
                }
            } catch (e) {
                log(`Erro ao verificar ordem de compra ${buyOrder.id}: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, config.CHECK_ORDERS_FREQUENCY));
        }

        for (const sellOrder of sellOrders) {
            try {
                const order = await exchange.fetchOrder(sellOrder.id);
                if (order.info.status === config.CLOSED_ORDER_STATUS) {
                    log(`✅ Ordem de venda executada a ${order.price}`);
                    closedOrderIds.push(order.id);
                   // Criar nova ordem de compra com mesma quantidade de BTC vendida
                    const sellAmountBTC = parseFloat(sellOrder.amount);
                    const newBuyPrice = parseFloat(order.price) - config.GRID_SIZE;
                    log(`🔁 Criando nova COMPRA em ${newBuyPrice}`);
                    const newBuy = await exchange.createLimitBuyOrder(config.SYMBOL, sellAmountBTC, newBuyPrice);
                    buyOrders.push({ ...newBuy.info, amount: sellAmountBTC });
                }
            } catch (e) {
                log(`Erro ao verificar ordem de venda ${sellOrder.id}: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, config.CHECK_ORDERS_FREQUENCY));
        }

        buyOrders = buyOrders.filter(o => !closedOrderIds.includes(o.id));
        sellOrders = sellOrders.filter(o => !closedOrderIds.includes(o.id));
        saveOrders(buyOrders, sellOrders);

        if (sellOrders.length === 0) {
            log(`🔚 Nenhuma ordem de venda restante. Encerrando bot.`);
            process.exit(1);
        }
    }
})();
