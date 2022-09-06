const generateTagNo = () => {
    let tagNo = ''
    let secondHalf = ''
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

    let rand1 = Math.round(Math.random() * letters.length)
    let rand2 = Math.round(Math.random() * letters.length)
    let rand3 = Math.round(Math.random() * letters.length)

    let firstLetter = letters[rand1]
    let secondLetter = letters[rand2]
    let thirdLetter = letters[rand3]
    let firstHalf = `${firstLetter}${secondLetter}${thirdLetter}`

    for (let i = 0; i <= 3; i++) {
        const randomNum = Math.round(Math.random() * 9)
        secondHalf += randomNum
    }
	
    tagNo = `${firstHalf} ${secondHalf}`
  	console.log(tagNo)

    return tagNo
}

module.exports = { generateTagNo }