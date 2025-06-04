const orders = [
    { leverage: 10, amount: 100, user_id: '12345' },
    { leverage: 5, amount: 200, user_id: '67890' },
    { leverage: 20, amount: 300, user_id: '54321' },
    { leverage: 15, amount: 150, user_id: '98765' },
    { leverage: 25, amount: 250, user_id: '11223' },
    { leverage: 30, amount: 350, user_id: '44556' },
    { leverage: 10, amount: 180, user_id: '77889' },
    { leverage: 5, amount: 220, user_id: '33445' },

    { leverage: 5, amount: 270, user_id: '66778' },
    { leverage: 25, amount: 320, user_id: '99001' },
    { leverage: 10, amount: 130, user_id: '22334' },

    { leverage: 5, amount: 80, user_id: '55667' },
    { leverage: 10, amount: 170, user_id: '88990' },
    { leverage: 20, amount: 280, user_id: '12321' },
    { leverage: 5, amount: 90, user_id: '45678' },
];
// Example orders array
// sort leverage and amount
orders.sort((a, b) => {
    if (a.leverage === b.leverage) {
        return a.amount - b.amount; // Sort by amount if leverage is the same
    }
    return a.leverage - b.leverage; // Sort by leverage
});
console.log("Sorted Orders: ", orders);