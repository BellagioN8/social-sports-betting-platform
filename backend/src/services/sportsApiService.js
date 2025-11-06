/**
 * Sports API Service
 * Integration with external sports data providers
 *
 * NOTE: This is a mock implementation for development.
 * Replace with actual API integration (e.g., ESPN, The Odds API, SportsData.io)
 */

const axios = require('axios');

// Configuration
const API_KEY = process.env.SPORTS_API_KEY || 'demo_key';
const API_URL = process.env.SPORTS_API_URL || 'https://api.example.com';
const TIMEOUT = 10000; // 10 seconds

class SportsAPIService {
  /**
   * Fetch live scores for a specific sport
   * @param {string} sportType - Sport type
   * @param {Date} date - Date to fetch scores for
   * @returns {Promise<Array>} Games array
   */
  static async fetchLiveScores(sportType, date = new Date()) {
    // Mock implementation - replace with actual API call
    console.log(`Fetching live scores for ${sportType} on ${date.toDateString()}`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return mock data
    return this._generateMockGames(sportType, date);
  }

  /**
   * Fetch game details by ID
   * @param {string} gameId - Game ID
   * @returns {Promise<object>} Game details
   */
  static async fetchGameById(gameId) {
    console.log(`Fetching game details for ${gameId}`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Parse game ID to extract info
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

    await new Promise((resolve) => setTimeout(resolve, 100));

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
   * Real API integration example (commented out)
   * Uncomment and modify when integrating with actual API
   */
  // static async fetchLiveScoresFromRealAPI(sportType, date) {
  //   try {
  //     const response = await axios.get(`${API_URL}/scores`, {
  //       params: {
  //         sport: sportType,
  //         date: date.toISOString().split('T')[0],
  //         api_key: API_KEY,
  //       },
  //       timeout: TIMEOUT,
  //     });
  //
  //     // Transform API response to our format
  //     return response.data.games.map((game) => ({
  //       gameId: game.id,
  //       sportType: sportType,
  //       homeTeam: game.home.name,
  //       awayTeam: game.away.name,
  //       homeTeamLogo: game.home.logo,
  //       awayTeamLogo: game.away.logo,
  //       homeScore: game.home.score,
  //       awayScore: game.away.score,
  //       status: game.status,
  //       period: game.period,
  //       timeRemaining: game.time_remaining,
  //       scheduledAt: new Date(game.scheduled_at),
  //       startedAt: game.started_at ? new Date(game.started_at) : null,
  //       completedAt: game.completed_at ? new Date(game.completed_at) : null,
  //       venue: game.venue,
  //       metadata: game,
  //     }));
  //   } catch (error) {
  //     console.error('Error fetching scores from API:', error.message);
  //     throw new Error('Failed to fetch live scores');
  //   }
  // }

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
