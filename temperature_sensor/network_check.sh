#!/bin/bash

# Which Interface do you want to check
wlan='wlan0'
# Which address do you want to ping to see if you can connect
pingip='google.com'

# Perform the network check and reset if necessary
/bin/ping -c 2 -I $wlan $pingip > /dev/null 2> /dev/null
if [ $? -ge 1 ] ; then
    echo "Network is DOWN. Performing a reset"
    /sbin/ifdown $wlan
    sleep 5
    /sbin/ifup --force $wlan
fi
