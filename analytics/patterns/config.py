"""
Pattern Detection Configuration
All detection thresholds are externalized here per Section 5B & Section 29.
No threshold is hardcoded inline inside detector logic.
"""

# Fan-out Configuration
FAN_OUT_MIN_DESTINATIONS = 5
FAN_OUT_WINDOW_MINUTES = 30

# Fan-in Configuration
FAN_IN_MIN_SOURCES = 5
FAN_IN_WINDOW_MINUTES = 30

# Rapid Pass-Through Configuration
RAPID_PASSTHROUGH_MIN_RATIO = 0.80  # 80% of received funds forwarded
RAPID_PASSTHROUGH_MAX_MINUTES = 10  # within 10 minutes

# Transaction Fragmentation / Smurfing Configuration
FRAGMENTATION_MIN_COUNT = 4         # >= 4 transactions to same destination
FRAGMENTATION_WINDOW_MINUTES = 15   # within 15 minutes

# Suspicious Velocity Configuration
VELOCITY_WINDOW_MINUTES = 60        # 1 hour rolling window
VELOCITY_MULTIPLIER_FACTOR = 5.0    # 5x trailing average or burst spike (>=5 in window for new/burst accounts)
VELOCITY_MIN_BURST_COUNT = 5        # Minimum transaction count to consider a burst

# Circular Movement Configuration
CIRCULAR_MAX_CYCLE_LENGTH = 6       # Maximum hop cycle length
CIRCULAR_WINDOW_HOURS = 24          # Within 24 hours

# Shared Device Configuration
SHARED_DEVICE_MIN_ACCOUNTS = 2      # >= 2 accounts sharing hardware fingerprint

# New Intermediary Configuration
NEW_INTERMEDIARY_MAX_AGE_DAYS = 7   # Account created within 7 days of activity
