import sqlite3
import random
import tkinter as tk
from tkinter import simpledialog, messagebox
from tkinter import font as tkFont

class Card:
    def __init__(self, color, value):
        self.color = color
        self.value = value

    def __str__(self):
        return f"{self.color} {self.value}"

class Deck:
    def __init__(self):
        self.cards = []
        colors = ['Red', 'Yellow', 'Green', 'Blue']
        values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', 'Draw Two']
        wild_cards = ['Wild', 'Wild Draw Four']

        for color in colors:
            for value in values:
                self.cards.append(Card(color, value))
                if value != '0':  # Each number card appears twice except '0'
                    self.cards.append(Card(color, value))

        for wild in wild_cards:
            for _ in range(4):  # Four of each wild card
                self.cards.append(Card('Wild', wild))
        
        self.shuffle()

    def shuffle(self):
        random.shuffle(self.cards)

    def draw_card(self):
        return self.cards.pop() if self.cards else None

class Player:
    def __init__(self, name, is_ai=False):
        self.name = name
        self.hand = []
        self.is_ai = is_ai
        self.score = 0  # Track the number of rounds won

    def draw(self, deck, num=1):
        for _ in range(num):
            card = deck.draw_card()
            if card:
                self.hand.append(card)

    def play_card(self, card):
        self.hand.remove(card)
        return card

    def has_valid_card(self, top_card):
        for card in self.hand:
            if card.color == top_card.color or card.value == top_card.value or card.color == 'Wild':
                return True
        return False

    def choose_card(self, top_card):
        valid_cards = [card for card in self.hand if card.color == top_card.color or card.value == top_card.value or card.color == 'Wild']
        
        if not valid_cards:
            return None

        # Prefer playing Draw Two, Skip, or Reverse cards strategically
        special_cards = [card for card in valid_cards if card.value in ['Draw Two', 'Skip', 'Reverse']]
        if special_cards:
            return random.choice(special_cards)

        # Use Wild and Wild Draw Four cards only if no other valid cards
        wild_cards = [card for card in valid_cards if card.color == 'Wild']
        non_wild_cards = [card for card in valid_cards if card.color != 'Wild']
        
        if non_wild_cards:
            return random.choice(non_wild_cards)
        else:
            return random.choice(wild_cards)

    def __str__(self):
        return f"{self.name}'s hand: " + ", ".join(str(card) for card in self.hand)

class UnoGame:
    def __init__(self, players):
        self.db_connection = sqlite3.connect('uno_game.db')
        self.create_tables()
        self.deck = Deck()
        self.players = [Player(name, is_ai=(name == "AI")) for name in players]
        self.current_player = 0
        self.direction = 1
        self.top_card = self.deck.draw_card()
        while self.top_card.color == 'Wild':  # Ensure the game starts with a non-wild card
            self.deck.cards.insert(0, self.top_card)
            self.top_card = self.deck.draw_card()
        for player in self.players:
            player.draw(self.deck, 7)
        self.save_game_state()

    def create_tables(self):
        cursor = self.db_connection.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS games (
                game_id INTEGER PRIMARY KEY,
                current_player INTEGER,
                direction INTEGER,
                top_card_color TEXT,
                top_card_value TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS players (
                player_id INTEGER PRIMARY KEY,
                game_id INTEGER,
                name TEXT,
                hand TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cards (
                card_id INTEGER PRIMARY KEY,
                game_id INTEGER,
                color TEXT,
                value TEXT,
                location TEXT  -- 'deck' or 'discard'
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS moves (
                move_id INTEGER PRIMARY KEY,
                game_id INTEGER,
                player_id INTEGER,
                card_color TEXT,
                card_value TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.db_connection.commit()

    def save_game_state(self):
        cursor = self.db_connection.cursor()
        cursor.execute('DELETE FROM games')
        cursor.execute('DELETE FROM players')
        cursor.execute('DELETE FROM cards')

        cursor.execute('''
            INSERT INTO games (game_id, current_player, direction, top_card_color, top_card_value)
            VALUES (1, ?, ?, ?, ?)
        ''', (self.current_player, self.direction, self.top_card.color, self.top_card.value))

        for i, player in enumerate(self.players):
            hand = ','.join(f"{card.color}:{card.value}" for card in player.hand)
            cursor.execute('''
                INSERT INTO players (player_id, game_id, name, hand)
                VALUES (?, 1, ?, ?)
            ''', (i, player.name, hand))

        for card in self.deck.cards:
            cursor.execute('''
                INSERT INTO cards (game_id, color, value, location)
                VALUES (1, ?, ?, 'deck')
            ''', (card.color, card.value))

        cursor.execute('''
            INSERT INTO cards (game_id, color, value, location)
            VALUES (1, ?, ?, 'discard')
        ''', (self.top_card.color, self.top_card.value))

        self.db_connection.commit()

    def load_game_state(self):
        cursor = self.db_connection.cursor()
        cursor.execute('SELECT current_player, direction, top_card_color, top_card_value FROM games WHERE game_id=1')
        game_state = cursor.fetchone()
        if game_state:
            self.current_player, self.direction, top_card_color, top_card_value = game_state
            self.top_card = Card(top_card_color, top_card_value)

        cursor.execute('SELECT name, hand FROM players WHERE game_id=1')
        players_data = cursor.fetchall()
        self.players = []
        for name, hand in players_data:
            player = Player(name, is_ai=(name == "AI"))
            player.hand = [Card(*card.split(':')) for card in hand.split(',')]
            self.players.append(player)

        cursor.execute('SELECT color, value FROM cards WHERE game_id=1 AND location="deck"')
        deck_cards = cursor.fetchall()
        self.deck.cards = [Card(color, value) for color, value in deck_cards]

    def record_move(self, player_id, card):
        cursor = self.db_connection.cursor()
        cursor.execute('''
            INSERT INTO moves (game_id, player_id, card_color, card_value)
            VALUES (1, ?, ?, ?)
        ''', (player_id, card.color, card.value))
        self.db_connection.commit()

    def next_player(self):
        self.current_player = (self.current_player + self.direction) % len(self.players)

    def play(self):
        while True:
            player = self.players[self.current_player]
            print(f"Top card: {self.top_card}")
            print(player)

            if player.has_valid_card(self.top_card):
                if player.is_ai:
                    card = player.choose_card(self.top_card)
                else:
                    card = None
                    for c in player.hand:
                        if c.color == self.top_card.color or c.value == self.top_card.value or c.color == 'Wild':
                            card = c
                            break

                if card:
                    print(f"{player.name} plays {card}")
                    self.top_card = player.play_card(card)
                    self.record_move(self.current_player, card)
                    if card.color == 'Wild':
                        chosen_color = random.choice(['Red', 'Yellow', 'Green', 'Blue']) if player.is_ai else simpledialog.askstring("Wild Card", f"{player.name}, choose a color: Red, Yellow, Green, Blue")
                        self.top_card.color = chosen_color
                    if card.value == 'Skip':
                        self.next_player()
                    elif card.value == 'Reverse':
                        self.direction *= -1
                    elif card.value == 'Draw Two':
                        self.next_player()
                        self.players[self.current_player].draw(self.deck, 2)
                    elif card.value == 'Wild Draw Four':
                        self.next_player()
                        self.players[self.current_player].draw(self.deck, 4)
                else:
                    player.draw(self.deck)
                    if not player.has_valid_card(self.top_card):
                        self.next_player()
            else:
                print(f"{player.name} has no valid card to play, drawing a card.")
                player.draw(self.deck)
                if not player.has_valid_card(self.top_card):
                    self.next_player()

            if not player.hand:
                player.score += 1  # Increment the player's score
                self.save_game_state()
                self.end_game(player)
                break

            self.save_game_state()
            self.next_player()

    def end_game(self, winner):
        messagebox.showinfo("Game Over", f"{winner.name} wins this round!")
        self.reset_game()

    def reset_game(self):
        for player in self.players:
            player.hand.clear()
        self.deck = Deck
