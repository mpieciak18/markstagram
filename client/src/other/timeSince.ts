const timeSince = (date: Date) => {
	const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

	let interval = seconds / 31536000;

	// Return as weeks
	interval = seconds / 604800;
	if (interval >= 2) {
		return `${Math.floor(interval)} weeks ago`;
	}
	if (interval >= 1) {
		return '1 week ago';
	}

	// Return as days
	interval = seconds / 86400;
	if (interval >= 2) {
		return `${Math.floor(interval)} days ago`;
	}
	if (interval >= 1) {
		return '1 day ago';
	}

	// Return as hours
	interval = seconds / 3600;
	if (interval >= 2) {
		return `${Math.floor(interval)} hours ago`;
	}
	if (interval >= 1) {
		return '1 hour ago';
	}

	// Returns as minutes or seconds
	interval = seconds / 60;
	if (interval >= 2) {
		return `${Math.floor(interval)} minutes ago`;
	}
	if (interval >= 1) {
		return '1 minute ago';
	}
	if (seconds >= 2) {
		return `${Math.floor(seconds)} seconds ago`;
	}
	return '1 second ago';
};

export { timeSince };
