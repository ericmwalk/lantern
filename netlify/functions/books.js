exports.handler = async (event) => {
  // Dynamically import node-fetch (to handle ESM issue)
  const fetch = (await import('node-fetch')).default;
  
  const { queryStringParameters } = event;
  // Use "search" as the query parameter to align with your other APIs
  const searchTerm = queryStringParameters.search;
  
  if (!searchTerm) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing search query.' }),
    };
  }

  // Retrieve the API key from the environment
  const apiKey = process.env.BOOKS_API;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured.' }),
    };
  }

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=20&key=${apiKey}`;
//  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching data from Google Books API: ${response.statusText}`);
    }
  
    const data = await response.json();
  
    if (!data.items) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No books found.' }),
      };
    }
  
    const results = data.items.map((item) => {
      const volume = item.volumeInfo;
      
      // Extract the main title (ignoring additional subtitles after a colon)
      const mainTitle = volume.title.split(':')[0];
      const formattedTitle = mainTitle.trim().replace(/\s+/g, '_').replace(/[^\w_]+/g, '');
      // Build the custom infoLink with the desired format
      const newInfoLink = `https://www.google.com/books/edition/${formattedTitle}/${item.id}?hl=en`;
      
      // Extract the published year if available (first 4 characters)
      const year = volume.publishedDate ? volume.publishedDate.slice(0, 4) : '';
      
      // Join authors if available, otherwise fallback to "Unknown"
      const authors = volume.authors ? volume.authors.join(', ') : 'Unknown';
  
      return {
        title: volume.title,
        authors: authors,
        year: year,
        link: newInfoLink,
        poster: volume.imageLinks?.thumbnail || '',
        backdrop: volume.imageLinks?.thumbnail || ''
      };
    });
  
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};


