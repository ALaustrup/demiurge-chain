#!/bin/bash
# Check existing users in qor_auth database
sudo -u postgres psql qor_auth -c "SELECT username, discriminator, email, role, status FROM users LIMIT 10;"
