/**
 * Sports API Service
 * Integration with API Sports (api-sports.io) for NFL and other sports
 */

const axios = require('axios');

// Configuration
const USE_REAL_API = process.env.USE_REAL_API === 'true';
const API_SPORTS_KEY = process.env.API_SPORTS_KEY;
const API_SPORTS_NFL_URL = 'https://v1.american-football.api-sports.io';
const TIMEOUT = 15000; // 15 seconds
// Use current year for NFL season (can be overridden via env var)
const CURRENT_NFL_SEASON = process.env.API_SPORTS_SEASON || new Date().getFullYear().toString();

class SportsAPIService {
  /**
   * Fetch live scores for a specific sport
   * @param {string} sportType - Sport type
   * @param {Date} date - Date to fetch scores for
   * @returns {Promise<Array>} Games array
   */
  static async fetchLiveScores(sportType, date = new Date()) {
    console.log(`Fetching live scores for ${sportType} on ${date.toDateString()}`);

    // Use real API for football (NFL) if enabled
    if (USE_REAL_API && sportType === 'football' && API_SPORTS_KEY) {
      try {
        return await this._fetchNFLGamesFromAPI(date, 'all');
      } catch (error) {
        console.error('API Sports error, falling back to mock data:', error.message);
        return this._generateMockGames(sportType, date);
      }
    }

    // Use mock data for other sports or if API is disabled
    return this._generateMockGames(sportType, date);
  }

  /**
   * Fetch game details by ID
   * @param {string} gameId - Game ID
   * @returns {Promise<object>} Game details
   */
  static async fetchGameById(gameId) {
    console.log(`Fetching game details for ${gameId}`);

    // If game ID is a number, it's from API Sports
    if (USE_REAL_API && API_SPORTS_KEY && !gameId.includes('_')) {
      try {
        return await this._fetchNFLGameByIdFromAPI(gameId);
      } catch (error) {
        console.error('API Sports error:', error.message);
        return null;
      }
    }

    // Mock data fallback
    const [sportType, date, index] = gameId.split('_');
    const games = this._generateMockGames(sportType, new Date(date || Date.now()));
    return games[parseInt(index) || 0] || null;
  }

  /**
   * Fetch upcoming games
   * @param {string} sportType - Sport type
   * @param {number} days - Number of days ahead
   * @returns {Promise<Array>} Upcoming games
   */
  static async fetchUpcomingGames(sportType, days = 7) {
    console.log(`Fetching upcoming games for ${sportType} (${days} days)`);

    // Use real API for football (NFL) if enabled
    if (USE_REAL_API && sportType === 'football' && API_SPORTS_KEY) {
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        return await this._fetchNFLGamesFromAPI(startDate, 'scheduled', endDate);
      } catch (error) {
        console.error('API Sports error, falling back to mock data:', error.message);
      }
    }

    // Mock data fallback
    const games = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dayGames = this._generateMockGames(sportType, date, 'scheduled');
      games.push(...dayGames);
    }

    return games;
  }

  /**
   * Fetch NFL games from API Sports
   * @private
   * @param {Date} date - Date to fetch
   * @param {string} status - Game status filter (all, live, scheduled, finished)
   * @param {Date} endDate - Optional end date for range
   * @returns {Promise<Array>} Games array
   */
  static async _fetchNFLGamesFromAPI(date, status = 'all', endDate = null) {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const params = {
        league: '1', // NFL league ID
        season: CURRENT_NFL_SEASON.toString(),
        date: dateStr,
      };

      // Add status filter if not 'all'
      // Note: 'scheduled' status doesn't exist in API, only use 'live', 'finished', or omit for all
      if (status !== 'all' && status !== 'scheduled') {
        params.status = status;
      }

      const response = await axios.get(`${API_SPORTS_NFL_URL}/games`, {
        params,
        headers: {
          'x-apisports-key': API_SPORTS_KEY,
        },
        timeout: TIMEOUT,
      });

      // Check for API errors
      if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
        const errorMsg = JSON.stringify(response.data.errors);
        console.warn('API Sports returned errors:', errorMsg);

        // If it's a plan limitation, throw to fall back to mock data
        if (errorMsg.includes('Free plans')) {
          throw new Error(`API Sports plan limitation: ${errorMsg}`);
        }
      }

      if (!response.data || !response.data.response || response.data.response.length === 0) {
        console.log('No games found for the requested date/filters');
        return [];
      }

      // Transform API Sports response to our format
      return response.data.response.map((game) => this._transformNFLGame(game));
    } catch (error) {
      if (error.response) {
        console.error('API Sports HTTP Error:', error.response.status, error.response.data);
      } else {
        console.error('API Sports Error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Fetch single NFL game by ID from API Sports
   * @private
   * @param {string} gameId - Game ID
   * @returns {Promise<object>} Game details
   */
  static async _fetchNFLGameByIdFromAPI(gameId) {
    try {
      const response = await axios.get(`${API_SPORTS_NFL_URL}/games`, {
        params: {
          id: gameId,
        },
        headers: {
          'x-apisports-key': API_SPORTS_KEY,
        },
        timeout: TIMEOUT,
      });

      if (!response.data || !response.data.response || response.data.response.length === 0) {
        return null;
      }

      return this._transformNFLGame(response.data.response[0]);
    } catch (error) {
      console.error('API Sports Error fetching game:', error.message);
      throw error;
    }
  }

  /**
   * Transform API Sports NFL game data to our format
   * @private
   * @param {object} apiGame - Game data from API Sports
   * @returns {object} Transformed game data
   */
  static _transformNFLGame(apiGame) {
    // Map API Sports status to our status
    const statusMap = {
      'NS': 'scheduled',     // Not Started
      'LIVE': 'live',        // In Progress
      'Q1': 'live',
      'Q2': 'live',
      'HT': 'halftime',      // Halftime
      'Q3': 'live',
      'Q4': 'live',
      'OT': 'live',          // Overtime
      'BT': 'live',          // Break Time
      'P': 'live',           // Pending
      'SUSP': 'postponed',   // Suspended
      'INT': 'postponed',    // Interrupted
      'FT': 'final',         // Finished
      'AET': 'final',        // After Extra Time
      'PEN': 'final',        // Penalties
      'PST': 'postponed',    // Postponed
      'CANC': 'cancelled',   // Cancelled
      'ABD': 'cancelled',    // Abandoned
      'AWD': 'final',        // Technical Loss
      'WO': 'final',         // WalkOver
    };

    const status = statusMap[apiGame.game.status.short] || 'scheduled';
    const isLive = ['live', 'halftime'].includes(status);
    const isFinal = status === 'final';

    return {
      gameId: apiGame.game.id.toString(),
      sportType: 'football',
      homeTeam: apiGame.teams.home.name,
      awayTeam: apiGame.teams.away.name,
      homeTeamLogo: apiGame.teams.home.logo,
      awayTeamLogo: apiGame.teams.away.logo,
      homeScore: apiGame.scores.home.total || 0,
      awayScore: apiGame.scores.away.total || 0,
      status: status,
      period: apiGame.game.status.long || null,
      timeRemaining: isLive ? apiGame.game.status.timer || null : null,
      scheduledAt: new Date(apiGame.game.date.date || apiGame.game.date.timestamp * 1000),
      startedAt: isLive || isFinal ? new Date(apiGame.game.date.timestamp * 1000) : null,
      completedAt: isFinal ? new Date(apiGame.game.date.timestamp * 1000) : null,
      venue: apiGame.game.venue.name || null,
      metadata: {
        league: apiGame.league.name,
        season: apiGame.league.season,
        week: apiGame.game.week,
        apiSportsId: apiGame.game.id,
        stage: apiGame.game.stage,
        quarters: {
          home: apiGame.scores.home,
          away: apiGame.scores.away,
        },
      },
    };
  }

  /**
   * Generate mock game data for development
   * @private
   */
  static _generateMockGames(sportType, date, defaultStatus = 'live') {
    const teams = this._getTeamsBySport(sportType);
    const games = [];

    // Generate 3-5 games
    const gameCount = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < gameCount; i++) {
      const homeIndex = Math.floor(Math.random() * teams.length);
      let awayIndex = Math.floor(Math.random() * teams.length);

      // Ensure different teams
      while (awayIndex === homeIndex) {
        awayIndex = Math.floor(Math.random() * teams.length);
      }

      const status = defaultStatus === 'scheduled' ? 'scheduled' : this._randomStatus();
      const homeScore = status === 'scheduled' ? 0 : Math.floor(Math.random() * 35);
      const awayScore = status === 'scheduled' ? 0 : Math.floor(Math.random() * 35);

      const scheduledTime = new Date(date);
      scheduledTime.setHours(12 + i * 2, 0, 0, 0);

      games.push({
        gameId: `${sportType}_${date.toISOString().split('T')[0]}_${i}`,
        sportType: sportType,
        homeTeam: teams[homeIndex].name,
        awayTeam: teams[awayIndex].name,
        homeTeamLogo: teams[homeIndex].logo,
        awayTeamLogo: teams[awayIndex].logo,
        homeScore: homeScore,
        awayScore: awayScore,
        status: status,
        period: this._getPeriodBySport(sportType, status),
        timeRemaining: status === 'live' ? '12:34' : null,
        scheduledAt: scheduledTime,
        startedAt: status !== 'scheduled' ? scheduledTime : null,
        completedAt: status === 'final' ? new Date(scheduledTime.getTime() + 3 * 60 * 60 * 1000) : null,
        venue: `${teams[homeIndex].city} Stadium`,
        metadata: {
          league: teams[homeIndex].league,
          season: '2024',
        },
      });
    }

    return games;
  }

  /**
   * Get teams by sport type
   * @private
   */
  static _getTeamsBySport(sportType) {
    const teams = {
      football: [
        { name: 'Dallas Cowboys', city: 'Dallas', league: 'NFL', logo: '/logos/cowboys.png' },
        { name: 'Philadelphia Eagles', city: 'Philadelphia', league: 'NFL', logo: '/logos/eagles.png' },
        { name: 'New England Patriots', city: 'New England', league: 'NFL', logo: '/logos/patriots.png' },
        { name: 'Green Bay Packers', city: 'Green Bay', league: 'NFL', logo: '/logos/packers.png' },
        { name: 'Kansas City Chiefs', city: 'Kansas City', league: 'NFL', logo: '/logos/chiefs.png' },
      ],
      basketball: [
        { name: 'Los Angeles Lakers', city: 'Los Angeles', league: 'NBA', logo: '/logos/lakers.png' },
        { name: 'Boston Celtics', city: 'Boston', league: 'NBA', logo: '/logos/celtics.png' },
        { name: 'Golden State Warriors', city: 'Golden State', league: 'NBA', logo: '/logos/warriors.png' },
        { name: 'Chicago Bulls', city: 'Chicago', league: 'NBA', logo: '/logos/bulls.png' },
        { name: 'Miami Heat', city: 'Miami', league: 'NBA', logo: '/logos/heat.png' },
      ],
      baseball: [
        { name: 'New York Yankees', city: 'New York', league: 'MLB', logo: '/logos/yankees.png' },
        { name: 'Boston Red Sox', city: 'Boston', league: 'MLB', logo: '/logos/redsox.png' },
        { name: 'Los Angeles Dodgers', city: 'Los Angeles', league: 'MLB', logo: '/logos/dodgers.png' },
        { name: 'Chicago Cubs', city: 'Chicago', league: 'MLB', logo: '/logos/cubs.png' },
        { name: 'San Francisco Giants', city: 'San Francisco', league: 'MLB', logo: '/logos/giants.png' },
      ],
      soccer: [
        { name: 'Real Madrid', city: 'Madrid', league: 'La Liga', logo: '/logos/realmadrid.png' },
        { name: 'Barcelona', city: 'Barcelona', league: 'La Liga', logo: '/logos/barcelona.png' },
        { name: 'Manchester United', city: 'Manchester', league: 'Premier League', logo: '/logos/manutd.png' },
        { name: 'Liverpool', city: 'Liverpool', league: 'Premier League', logo: '/logos/liverpool.png' },
        { name: 'Bayern Munich', city: 'Munich', league: 'Bundesliga', logo: '/logos/bayern.png' },
      ],
      hockey: [
        { name: 'Montreal Canadiens', city: 'Montreal', league: 'NHL', logo: '/logos/canadiens.png' },
        { name: 'Toronto Maple Leafs', city: 'Toronto', league: 'NHL', logo: '/logos/mapleleafs.png' },
        { name: 'Boston Bruins', city: 'Boston', league: 'NHL', logo: '/logos/bruins.png' },
        { name: 'Chicago Blackhawks', city: 'Chicago', league: 'NHL', logo: '/logos/blackhawks.png' },
        { name: 'Detroit Red Wings', city: 'Detroit', league: 'NHL', logo: '/logos/redwings.png' },
      ],
    };

    return teams[sportType] || teams.football;
  }

  /**
   * Get random game status
   * @private
   */
  static _randomStatus() {
    const statuses = ['scheduled', 'live', 'halftime', 'final'];
    const weights = [0.3, 0.3, 0.1, 0.3]; // 30% scheduled, 30% live, 10% halftime, 30% final

    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return statuses[i];
      }
    }

    return 'live';
  }

  /**
   * Get period by sport
   * @private
   */
  static _getPeriodBySport(sportType, status) {
    if (status === 'scheduled') return null;
    if (status === 'halftime') return 'Halftime';
    if (status === 'final') return 'Final';

    const periods = {
      football: ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'],
      basketball: ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'],
      baseball: ['1st Inning', '5th Inning', '9th Inning'],
      soccer: ['1st Half', '2nd Half'],
      hockey: ['1st Period', '2nd Period', '3rd Period'],
    };

    const sportPeriods = periods[sportType] || periods.football;
    return sportPeriods[Math.floor(Math.random() * sportPeriods.length)];
  }
}

module.exports = SportsAPIService;
