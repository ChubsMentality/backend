const generateTagNo = () => {
    let tagNo = ''

    for (let i = 0; i <= 3; i++) {
        const randomNum = Math.round(Math.random() * 9)
        tagNo += randomNum
    }

    return tagNo
}

module.exports = { generateTagNo }