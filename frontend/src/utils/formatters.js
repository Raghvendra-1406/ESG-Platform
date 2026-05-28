export const formatQuantity = (q) => (q == null ? '-' : Number(q).toLocaleString())

export const formatDate = (value) => {
	if (!value) return '-'
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

export const formatCurrency = (value, currency = 'USD') => {
	if (value == null) return '-'
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value))
	} catch {
		return `${Number(value).toLocaleString()} ${currency}`
	}
}
