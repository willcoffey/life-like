terminal-life --rule b3456s3456 --reset-random --width 400 --height 200 --ticks 100 --out example_1.png
terminal-life --width 400 --height 200 --rule b3s23 --activation sin --theme managua --ticks 100 --phase --out example_2.png
terminal-life --width 400 --height 200 --rule b3s23 --activation sin --theme managua --ticks 100 --rate 3 --phase --out example_3.png
terminal-life --width 400 --height 200 --rule b3s23 --activation gaussian --theme berlin --ticks 300 --rate 3 --phase --out example_4.png
terminal-life --reset-random --width 300 --height 300 --rule b3s23 --activation gaussian --theme berlin --alpha 0.3 --beta 0.13 --rate 3 --ticks 150 --out example_5.png
terminal-life --load ./example_5.png --log-json

terminal-life --load example_5.png --stream --ticks 100 | \
ffmpeg -f rawvideo -pixel_format rgba -video_size 300x300 -framerate 10 -i - -loop 0 example_6.webp
terminal-life --load example_5.png  --ticks 100 --out example_7.png
terminal-life --load example_7.png --stream --ticks 100 | \
ffmpeg -f rawvideo -pixel_format rgba -video_size 300x300 -framerate 10 -i - -loop 0 example_8.webp
